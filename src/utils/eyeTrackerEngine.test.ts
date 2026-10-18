import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractPupilFeaturesFromFrame,
  computeIrisGazeFromLandmarks,
  fitGazeCalibrationModel,
  predictScreenGaze,
  predictArenaGazePercent,
  hitTestWordBoxes,
  BlinkDetectorStateMachine,
  evaluateBlinkRateClinical,
} from './eyeTrackerEngine.ts';

test('extractPupilFeaturesFromFrame locates dark pupil centroids accurately and detects virtual gray frames', () => {
  const width = 160;
  const height = 120;
  const rgba = new Uint8ClampedArray(width * height * 4);

  // Fill background with realistic warm skin/sclera tone (R:215, G:195, B:180)
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 215;
    rgba[i + 1] = 195;
    rgba[i + 2] = 180;
    rgba[i + 3] = 255;
  }

  // Paint dark pupils toward the right side of both eye ROIs
  const paintDarkDot = (cx: number, cy: number) => {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const idx = (y * width + x) * 4;
        rgba[idx] = 10;
        rgba[idx + 1] = 10;
        rgba[idx + 2] = 10;
      }
    }
  };

  paintDarkDot(68, 48); // Inside left eye ROI (x: 40..75, y: 36..64)
  paintDarkDot(112, 48); // Inside right eye ROI (x: 84..120, y: 36..64)

  const features = extractPupilFeaturesFromFrame(rgba, width, height);
  assert.ok(features.leftEye.normX > 0.75);
  assert.ok(features.rightEye.normX > 0.75);
  assert.equal(features.isVirtualOrBlankFrame, false);
  assert.ok(features.confidence >= 80);

  // Now test a flat gray virtual camera placeholder frame
  const grayRgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < grayRgba.length; i += 4) {
    grayRgba[i] = 128;
    grayRgba[i + 1] = 128;
    grayRgba[i + 2] = 128;
    grayRgba[i + 3] = 255;
  }
  const virtualResult = extractPupilFeaturesFromFrame(grayRgba, width, height);
  assert.equal(virtualResult.isVirtualOrBlankFrame, true);
  assert.equal(virtualResult.confidence, 0);
});

test('computeIrisGazeFromLandmarks tracks horizontal AND vertical iris movement and displaces green dots properly', () => {
  const landmarks: { x: number; y: number; z?: number }[] = Array.from(
    { length: 478 },
    () => ({ x: 0.5, y: 0.5, z: 0 })
  );

  // Configure nose tip (1)
  landmarks[1] = { x: 0.5, y: 0.54 };

  // Configure right eye corners (33 outer, 133 inner, 159 top, 145 bottom)
  landmarks[33] = { x: 0.3, y: 0.4 };
  landmarks[133] = { x: 0.4, y: 0.4 };
  landmarks[159] = { x: 0.35, y: 0.38 };
  landmarks[145] = { x: 0.35, y: 0.42 };

  // Configure left eye corners (362 inner, 263 outer, 386 top, 374 bottom)
  landmarks[362] = { x: 0.6, y: 0.4 };
  landmarks[263] = { x: 0.7, y: 0.4 };
  landmarks[386] = { x: 0.65, y: 0.38 };
  landmarks[374] = { x: 0.65, y: 0.42 };

  // 1. Look right on mirrored canvas (small raw lm.x inside eye socket: 0.344 vs 0.350 = 6% shift)
  landmarks[468] = { x: 0.344, y: 0.4 };
  landmarks[473] = { x: 0.644, y: 0.4 };
  const gazeRight = computeIrisGazeFromLandmarks(landmarks, 320, 180);

  // 2. Look left on mirrored canvas (large raw lm.x inside eye socket: 0.356 vs 0.350 = -6% shift)
  landmarks[468] = { x: 0.356, y: 0.4 };
  landmarks[473] = { x: 0.656, y: 0.4 };
  const gazeLeft = computeIrisGazeFromLandmarks(landmarks, 320, 180);

  assert.ok(gazeRight && gazeLeft);
  assert.ok(gazeRight.combinedNormX > 0.85);
  assert.ok(gazeLeft.combinedNormX < 0.15);
  // Green dot x position must move substantially across the eye box (>15px on 320w canvas)
  assert.ok(gazeRight.leftEye.x - gazeLeft.leftEye.x > 15);
  assert.ok(gazeRight.rightEye.x - gazeLeft.rightEye.x > 15);

  // 3. Look up vs Look down (even if eyelids move slightly with iris!)
  landmarks[468] = { x: 0.35, y: 0.396 };
  landmarks[473] = { x: 0.65, y: 0.396 };
  const gazeUp = computeIrisGazeFromLandmarks(landmarks, 320, 180);

  landmarks[468] = { x: 0.35, y: 0.404 };
  landmarks[473] = { x: 0.65, y: 0.404 };
  const gazeDown = computeIrisGazeFromLandmarks(landmarks, 320, 180);

  assert.ok(gazeUp && gazeDown);
  assert.ok(gazeDown.combinedNormY > gazeUp.combinedNormY + 0.5);
  assert.ok(gazeDown.leftEye.y - gazeUp.leftEye.y > 10);
});

test('fitGazeCalibrationModel fits linear screen mapping and predicts gaze coordinates', () => {
  const samples = [
    { pointId: 1, normX: 0.2, normY: 0.2, screenX: 200, screenY: 150 },
    { pointId: 2, normX: 0.8, normY: 0.2, screenX: 1200, screenY: 150 },
    { pointId: 3, normX: 0.5, normY: 0.5, screenX: 700, screenY: 450 },
    { pointId: 4, normX: 0.2, normY: 0.8, screenX: 200, screenY: 750 },
    { pointId: 5, normX: 0.8, normY: 0.8, screenX: 1200, screenY: 750 },
  ];

  const model = fitGazeCalibrationModel(samples);
  assert.equal(model.isCalibrated, true);
  assert.ok(model.accuracyPercent >= 85);

  const predicted = predictScreenGaze(
    model,
    { normX: 0.5, normY: 0.5 },
    { width: 1440, height: 900 },
    null,
    1.0
  );
  assert.ok(Math.abs(predicted.x - 700) < 15);
  assert.ok(Math.abs(predicted.y - 450) < 15);
});

test('hitTestWordBoxes detects direct hit and nearest foveal word box', () => {
  const boxes = [
    { wordIndex: 0, left: 800, top: 200, right: 880, bottom: 245 },
    { wordIndex: 1, left: 700, top: 200, right: 780, bottom: 245 },
  ];

  assert.equal(hitTestWordBoxes(840, 220, boxes), 0);
  assert.equal(hitTestWordBoxes(740, 190, boxes), 1);
  assert.equal(hitTestWordBoxes(100, 100, boxes), null);
});

test('predictArenaGazePercent maps calibrated targets accurately inside the arena box without pegging at 94%', () => {
  const onePointModel = fitGazeCalibrationModel([
    {
      pointId: 3,
      normX: 0.5,
      normY: 0.5,
      screenX: 500,
      screenY: 477,
      arenaXPct: 50,
      arenaYPct: 50,
    },
  ]);
  assert.equal(onePointModel.isCalibrated, true);
  const centerPct = predictArenaGazePercent(onePointModel, {
    normX: 0.5,
    normY: 0.5,
  });
  assert.equal(centerPct.xPct, 50);
  assert.equal(centerPct.yPct, 50);
});

test('BlinkDetectorStateMachine detects valid EAR closure blinks and evaluateBlinkRateClinical classifies visual strain', () => {
  const detector = new BlinkDetectorStateMachine(0.21);

  // Establish open baseline around EAR = 0.28
  for (let i = 0; i < 6; i++) {
    detector.processFrame(0.28, i * 40);
  }
  assert.equal(detector.getBlinkCount(), 0);

  // Close eyelids (EAR drops to 0.14 at t=300ms) and reopen at t=440ms (140ms blink duration)
  const closedRes = detector.processFrame(0.14, 300);
  assert.equal(closedRes.isCurrentlyBlinking, true);
  detector.processFrame(0.13, 360);
  const reopenRes = detector.processFrame(0.28, 440);

  assert.equal(reopenRes.blinkCompleted, true);
  assert.equal(detector.getBlinkCount(), 1);

  // Manual blink recording also increments count
  detector.recordManualBlink(1000);
  assert.equal(detector.getBlinkCount(), 2);

  // Clinical evaluation for high blink rate (e.g. 12 blinks in 20 seconds = 36 blinks/min)
  const highStrain = evaluateBlinkRateClinical(12, 20, 0.26);
  assert.equal(highStrain.blinksPerMinute, 36);
  assert.equal(highStrain.visualStrainLevel, 'high');
  assert.ok(highStrain.visualStrainLabelAr.includes('إجهاد بصري مرتفع'));

  // Clinical evaluation for normal reading blink rate (e.g. 4 blinks in 20 seconds = 12 blinks/min)
  const normalStrain = evaluateBlinkRateClinical(4, 20, 0.28);
  assert.equal(normalStrain.blinksPerMinute, 12);
  assert.equal(normalStrain.visualStrainLevel, 'nominal');
});


