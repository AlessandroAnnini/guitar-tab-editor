import * as Tone from 'tone';
import type { InstrumentType } from './instruments';

// Get all notes in a range (e.g., E2 to E5)
function getNotesInRange(startNote: string, endNote: string): string[] {
  const notes = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  const result: string[] = [];

  // Parse start and end notes
  const startPitch = startNote.slice(0, -1);
  const startOctave = parseInt(startNote.slice(-1));
  const endPitch = endNote.slice(0, -1);
  const endOctave = parseInt(endNote.slice(-1));

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (const note of notes) {
      const fullNote = `${note}${octave}`;
      if (
        octave === startOctave &&
        notes.indexOf(note) < notes.indexOf(startPitch)
      )
        continue;
      if (octave === endOctave && notes.indexOf(note) > notes.indexOf(endPitch))
        continue;
      result.push(fullNote);
    }
  }
  return result;
}

// Convert guitar string and fret to note
function fretToNote(
  string: number,
  fret: number,
  instrument: InstrumentType = 'acoustic'
): string | null {
  // Standard tuning notes (from low to high)
  const tunings = {
    acoustic: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    electric: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    bass: ['E1', 'A1', 'D2', 'G2'],
    piano: [],
  };
  const openNotes = tunings[instrument];
  if (instrument === 'piano') {
    const baseNote = 60; // C4 in MIDI
    const midiNote = baseNote + string * 5 + fret;
    return Tone.Frequency(midiNote, 'midi').toNote();
  }
  if (string < 0 || string >= openNotes.length || fret < 0) return null;
  const openNote = openNotes[string];
  const noteBase = openNote.slice(0, -1);
  const octave = parseInt(openNote.slice(-1));
  const noteToSemitone: Record<string, number> = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };
  const baseSemitone = noteToSemitone[noteBase];
  const newSemitone = (baseSemitone + fret) % 12;
  let newOctave = octave + Math.floor((baseSemitone + fret) / 12);
  const semitoneToNote = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  const newNote = semitoneToNote[newSemitone] + newOctave;
  return newNote;
}

// Convert duration string to time value (seconds)
function durationToTime(duration: string, tempo: number): number {
  const bpm = tempo || 120;
  const beatsPerSecond = bpm / 60;
  const secondsPerBeat = 1 / beatsPerSecond;
  let fraction = 1; // default to quarter note
  if (duration) {
    const [numerator, denominator] = duration.split('/').map(Number);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      fraction = numerator / denominator;
    }
  }
  return secondsPerBeat * 4 * fraction; // 4 beats in a whole note
}

export { getNotesInRange, fretToNote, durationToTime };
