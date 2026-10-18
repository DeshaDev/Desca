import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent Emscripten / MediaPipe WASM C++ stderr INFO logs (e.g. "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.")
// from being emitted as console.error in the browser environment.
const isBenignMediaPipeLog = (args: unknown[]): boolean => {
  if (!args || args.length === 0) return false;
  const text = args
    .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : ''))
    .join(' ');
  return (
    text.includes('Created TensorFlow Lite XNNPACK delegate') ||
    text.includes('TensorFlow Lite') ||
    text.includes('XNNPACK') ||
    text.includes('absl::InitializeLog') ||
    text.includes('gl_context') ||
    text.includes('OpenGL error checking is disabled') ||
    /^INFO:\s/i.test(text.trim()) ||
    /^[IW]0000\s+00:00:/i.test(text.trim())
  );
};

const origConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (isBenignMediaPipeLog(args)) {
    return;
  }
  origConsoleError(...args);
};

const origConsoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (isBenignMediaPipeLog(args)) {
    return;
  }
  origConsoleWarn(...args);
};

createRoot(document.getElementById('root')!).render(<App />);
