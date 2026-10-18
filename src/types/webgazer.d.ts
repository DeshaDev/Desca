declare module 'webgazer' {
  export interface WebGazerEyePatch {
    patch: ImageData;
    imagex: number;
    imagey: number;
    width: number;
    height: number;
  }

  export interface WebGazerEyeFeatures {
    left: WebGazerEyePatch;
    right: WebGazerEyePatch;
  }

  export interface WebGazerPrediction {
    x: number;
    y: number;
    eyeFeatures?: WebGazerEyeFeatures;
    all?: { x: number; y: number }[];
  }

  export interface WebGazerTracker {
    getEyePatches: (
      video: HTMLVideoElement,
      imageCanvas: HTMLCanvasElement,
      width: number,
      height: number
    ) => Promise<WebGazerEyeFeatures | null | false>;
    getPositions: () => number[][] | null;
    drawFaceOverlay: (
      ctx: CanvasRenderingContext2D,
      keypoints: number[][] | null
    ) => void;
    reset: () => void;
    name?: string;
  }

  export interface WebGazerRegression {
    init: () => void;
    addData: (
      eyes: WebGazerEyeFeatures,
      screenPos: [number, number],
      type: 'click' | 'move'
    ) => void;
    predict: (eyesObj: WebGazerEyeFeatures) => { x: number; y: number } | null;
    setData: (data: any[]) => void;
    getData: () => any[];
    name?: string;
    eyeFeaturesClicks?: { length: number; data: number[][] };
    screenXClicksArray?: { length: number; data: number[][] };
    screenYClicksArray?: { length: number; data: number[][] };
  }

  export interface WebGazerInstance {
    params: {
      faceMeshSolutionPath: string;
      moveTickSize: number;
      videoContainerId: string;
      videoElementId: string;
      videoElementCanvasId: string;
      faceOverlayId: string;
      faceFeedbackBoxId: string;
      gazeDotId: string;
      videoViewerWidth: number;
      videoViewerHeight: number;
      faceFeedbackBoxRatio: number;
      showVideo: boolean;
      mirrorVideo: boolean;
      showFaceOverlay: boolean;
      showFaceFeedbackBox: boolean;
      showGazeDot: boolean;
      camConstraints: MediaStreamConstraints;
      dataTimestep: number;
      showVideoPreview: boolean;
      applyKalmanFilter: boolean;
      saveDataAcrossSessions: boolean;
      storingPoints: boolean;
      trackEye: 'both' | 'left' | 'right';
    };
    reg: {
      RidgeReg: new () => WebGazerRegression;
      RidgeWeightedReg: new () => WebGazerRegression;
      RidgeRegThreaded: new () => WebGazerRegression;
    };
    util: {
      getEyeFeats: (eyes: WebGazerEyeFeatures) => number[];
      resizeEye: (
        eye: WebGazerEyePatch,
        resizeWidth: number,
        resizeHeight: number
      ) => ImageData;
      grayscale: (
        pixels: Uint8ClampedArray,
        width: number,
        height: number
      ) => Uint8ClampedArray;
      equalizeHistogram: (
        src: Uint8ClampedArray | number[],
        step: number,
        dst: number[]
      ) => number[];
      bound: (prediction: { x: number; y: number }) => { x: number; y: number };
    };
    begin: (onFail?: () => void) => Promise<WebGazerInstance>;
    isReady: () => boolean;
    pause: () => WebGazerInstance;
    resume: () => Promise<WebGazerInstance>;
    end: () => WebGazerInstance;
    stopVideo: () => WebGazerInstance;
    detectCompatibility: () => boolean;
    showVideoPreview: (val: boolean) => WebGazerInstance;
    showVideo: (val: boolean) => WebGazerInstance;
    showFaceOverlay: (val: boolean) => WebGazerInstance;
    showFaceFeedbackBox: (val: boolean) => WebGazerInstance;
    showPredictionPoints: (val: boolean) => WebGazerInstance;
    saveDataAcrossSessions: (val: boolean) => WebGazerInstance;
    applyKalmanFilter: (val: boolean) => WebGazerInstance;
    setCameraConstraints: (constraints: MediaStreamConstraints) => Promise<void>;
    setVideoViewerSize: (w: number, h: number) => void;
    addMouseEventListeners: () => WebGazerInstance;
    removeMouseEventListeners: () => WebGazerInstance;
    recordScreenPosition: (
      x: number,
      y: number,
      eventType?: 'click' | 'move'
    ) => WebGazerInstance;
    setTracker: (name: string) => WebGazerInstance;
    setRegression: (
      name: 'ridge' | 'weightedRidge' | 'threadedRidge'
    ) => WebGazerInstance;
    addTrackerModule: (
      name: string,
      constructor: new () => WebGazerTracker
    ) => void;
    addRegressionModule: (
      name: string,
      constructor: new () => WebGazerRegression
    ) => void;
    setGazeListener: (
      listener: (data: WebGazerPrediction | null, elapsedTime: number) => void
    ) => WebGazerInstance;
    clearGazeListener: () => WebGazerInstance;
    setVideoElementCanvas: (canvas: HTMLCanvasElement) => HTMLCanvasElement;
    clearData: () => Promise<void>;
    getTracker: () => WebGazerTracker;
    getRegression: () => WebGazerRegression[];
    getCurrentPrediction: (
      regIndex?: number
    ) => Promise<WebGazerPrediction | null>;
    getVideoElementCanvas: () => HTMLCanvasElement;
    getStoredPoints: () => [number[], number[]];
  }

  const webgazer: WebGazerInstance;
  export default webgazer;
}
