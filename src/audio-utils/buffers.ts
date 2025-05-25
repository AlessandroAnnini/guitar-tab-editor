import * as Tone from 'tone';
import { getNotesInRange } from './noteUtils';
import type { InstrumentType } from './instruments';

// Note buffers for each instrument type
const noteBuffers: Record<InstrumentType, Tone.ToneAudioBuffers | null> = {
  acoustic: null,
  electric: null,
  bass: null,
  piano: null,
};

// Buffer loaded state for each instrument
const buffersLoaded: Record<InstrumentType, boolean> = {
  acoustic: false,
  electric: false,
  bass: false,
  piano: false,
};

// Preload all instrument note buffers in parallel
async function preloadNoteBuffers() {
  const acousticRange = { start: 'E2', end: 'E5' };
  const electricRange = { start: 'E2', end: 'E6' };
  const bassRange = { start: 'E0', end: 'G3' };
  const pianoRange = { start: 'A0', end: 'C8' };
  await Promise.all([
    preloadInstrumentBuffers(
      'acoustic',
      acousticRange.start,
      acousticRange.end
    ),
    preloadInstrumentBuffers(
      'electric',
      electricRange.start,
      electricRange.end
    ),
    preloadInstrumentBuffers('bass', bassRange.start, bassRange.end),
    preloadInstrumentBuffers('piano', pianoRange.start, pianoRange.end),
  ]);
}

// Preload buffers for a specific instrument
async function preloadInstrumentBuffers(
  instrument: InstrumentType,
  startNote: string,
  endNote: string
) {
  try {
    const noteBuffersObj: Record<string, Tone.ToneAudioBuffer> = {};
    const notes = getNotesInRange(startNote, endNote);
    const notesToLoad =
      instrument === 'piano' ? notes.filter((_, i) => i % 2 === 0) : notes;
    for (const note of notesToLoad) {
      try {
        const offlineCtx = new Tone.OfflineContext(
          2,
          2,
          Tone.getContext().sampleRate
        );
        let bufferSynth;
        switch (instrument) {
          case 'acoustic': {
            const acousticReverb = new Tone.Reverb({
              context: offlineCtx,
              decay: 1.5,
              wet: 0.2,
            }).toDestination();
            bufferSynth = new Tone.Synth({
              context: offlineCtx,
              oscillator: { type: 'triangle' },
              envelope: {
                attack: 0.002,
                decay: 0.15,
                sustain: 0.2,
                release: 1.2,
              },
            }).connect(acousticReverb);
            break;
          }
          case 'electric': {
            const electricDistortion = new Tone.Distortion({
              context: offlineCtx,
              distortion: 0.4,
              wet: 0.3,
            }).toDestination();
            bufferSynth = new Tone.AMSynth({
              context: offlineCtx,
              oscillator: { type: 'square' },
              envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 0.8,
              },
              modulation: { type: 'sine' },
              modulationEnvelope: {
                attack: 0.5,
                decay: 0,
                sustain: 1,
                release: 0.5,
              },
            }).connect(electricDistortion);
            break;
          }
          case 'bass': {
            bufferSynth = new Tone.MonoSynth({
              context: offlineCtx,
              oscillator: { type: 'sine' },
              envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.9,
                release: 1.5,
              },
              filter: {
                Q: 2,
                type: 'lowpass',
                rolloff: -24,
              },
              filterEnvelope: {
                attack: 0.05,
                decay: 0.5,
                sustain: 0.7,
                release: 2,
                baseFrequency: 200,
                octaves: 2.5,
              },
            }).toDestination();
            break;
          }
          case 'piano': {
            bufferSynth = new Tone.Synth({
              context: offlineCtx,
              oscillator: { type: 'triangle8' },
              envelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 0.3,
                release: 2,
              },
            }).toDestination();
            break;
          }
        }
        const duration = instrument === 'piano' ? 2 : 1.5;
        bufferSynth.triggerAttackRelease(note, duration, 0);
        const buffer = await offlineCtx.render();
        noteBuffersObj[note] = buffer;
      } catch (error) {
        console.error(
          `Failed to generate buffer for ${instrument} note ${note}:`,
          error
        );
      }
    }
    noteBuffers[instrument] = new Tone.ToneAudioBuffers(noteBuffersObj);
    buffersLoaded[instrument] = true;
  } catch (error) {
    console.error(`Failed to preload ${instrument} buffers:`, error);
  }
}

// Get current buffer for an instrument
function getCurrentBuffer(
  instrument: InstrumentType
): Tone.ToneAudioBuffers | null {
  return noteBuffers[instrument];
}

// Check if buffers for an instrument are loaded
function areBuffersLoaded(instrument: InstrumentType): boolean {
  return buffersLoaded[instrument];
}

export {
  noteBuffers,
  buffersLoaded,
  preloadNoteBuffers,
  preloadInstrumentBuffers,
  getCurrentBuffer,
  areBuffersLoaded,
};
