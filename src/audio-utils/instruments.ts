import * as Tone from 'tone';

// Supported instrument types
type InstrumentType = 'acoustic' | 'electric' | 'bass' | 'piano';

// Synths for different instruments
const synths: Record<InstrumentType, Tone.PolySynth | null> = {
  acoustic: null,
  electric: null,
  bass: null,
  piano: null,
};

// Effects for instruments
const effects = {
  acousticReverb: null as Tone.Reverb | null,
  electricDistortion: null as Tone.Distortion | null,
};

// Current instrument state
let currentInstrument: InstrumentType = 'acoustic';

// Initialize instrument synths and effects
const initInstruments = async () => {
  // Set up effects
  effects.acousticReverb = new Tone.Reverb({
    decay: 1.5,
    wet: 0.2,
  }).toDestination();

  effects.electricDistortion = new Tone.Distortion({
    distortion: 0.4,
    wet: 0.3,
  }).toDestination();

  // Create acoustic guitar synth (plucky with reverb)
  synths.acoustic = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.002,
      decay: 0.15,
      sustain: 0.2,
      release: 1.2,
    },
  }).connect(effects.acousticReverb!);

  // Create electric guitar synth (brighter with distortion)
  synths.electric = new Tone.PolySynth(Tone.AMSynth, {
    oscillator: {
      type: 'square',
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 0.8,
    },
    modulation: {
      type: 'sine',
    },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0,
      sustain: 1,
      release: 0.5,
    },
  }).connect(effects.electricDistortion!);

  // Create bass synth (deep and rounded)
  synths.bass = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.9,
      release: 1.5,
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

  // Create piano synth (bright and percussive)
  synths.piano = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle8',
    },
    envelope: {
      attack: 0.01,
      decay: 0.5,
      sustain: 0.3,
      release: 2,
    },
  }).toDestination();
};

// Set current instrument
const setInstrument = (instrumentType: InstrumentType): void => {
  if (currentInstrument === instrumentType) return;

  // Stop any current playback to avoid sound conflicts
  if (Tone.getTransport().state === 'started') {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }

  // Release any notes currently playing on the old instrument
  const currentSynth = synths[currentInstrument];
  if (currentSynth) {
    currentSynth.releaseAll();
  }

  currentInstrument = instrumentType;
};

// Get current synth
const getCurrentSynth = (): Tone.PolySynth | null => {
  return synths[currentInstrument];
};

export type { InstrumentType };
export {
  synths,
  effects,
  currentInstrument,
  setInstrument,
  getCurrentSynth,
  initInstruments,
};
