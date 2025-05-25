// Modular entry point for audio-utils
// Re-exports all public API for compatibility

import * as instruments from './instruments';
import * as noteUtils from './noteUtils';
import * as buffers from './buffers';
import * as playback from './playback';

// Main audioUtils object for compatibility
const audioUtils = {
  // Instruments
  ...instruments,
  // Note helpers
  ...noteUtils,
  // Buffers
  ...buffers,
  // Playback
  ...playback,
};

export default audioUtils;
export * from './instruments';
export * from './noteUtils';
export * from './buffers';
export * from './playback';
