import * as Tone from 'tone';
import { getCurrentSynth, currentInstrument } from './instruments';
import { getCurrentBuffer, areBuffersLoaded } from './buffers';
import { fretToNote, durationToTime } from './noteUtils';
import type { InstrumentType } from './instruments';

// Play a note from buffer if available, fall back to synth
function playNoteWithBuffer(
  note: string,
  duration: number,
  time: number,
  instrument: InstrumentType = currentInstrument
): void {
  const currentBuffer = getCurrentBuffer(instrument);
  const currentSynth = getCurrentSynth();
  const buffersLoaded = areBuffersLoaded(instrument);
  if (buffersLoaded && currentBuffer && currentBuffer.has(note)) {
    const buffer = currentBuffer.get(note);
    const source = new Tone.ToneBufferSource(buffer).toDestination();
    source.start(time, 0, duration);
  } else if (currentSynth) {
    currentSynth.triggerAttackRelease(note, duration, time);
  }
}

// Play a single note
async function playNote(
  string: number,
  fret: number,
  duration: string,
  instrument: InstrumentType = currentInstrument
): Promise<void> {
  const note = fretToNote(string, fret, instrument);
  if (!note) return;
  const durationTime = Tone.Time(duration).toSeconds();
  if (areBuffersLoaded(instrument) && getCurrentBuffer(instrument)) {
    playNoteWithBuffer(note, durationTime, Tone.now(), instrument);
  } else {
    const currentSynth = getCurrentSynth();
    if (currentSynth) {
      currentSynth.triggerAttackRelease(note, duration);
    }
  }
}

// Play a chord (multiple notes at once)
async function playChord(
  notes: { string: number; fret: number }[],
  duration: string,
  instrument: InstrumentType = currentInstrument
): Promise<void> {
  const toneNotes = notes
    .map((n) => fretToNote(n.string, n.fret, instrument))
    .filter(Boolean) as string[];
  if (toneNotes.length === 0) return;
  const durationTime = Tone.Time(duration).toSeconds();
  const time = Tone.now();
  if (areBuffersLoaded(instrument) && getCurrentBuffer(instrument)) {
    toneNotes.forEach((note) => {
      playNoteWithBuffer(note, durationTime, time, instrument);
    });
  } else {
    const currentSynth = getCurrentSynth();
    if (currentSynth) {
      currentSynth.triggerAttackRelease(toneNotes, duration);
    }
  }
}

// Play a bar of tab content (using Tone.Transport)
async function playBar(
  barNotes: {
    string: number;
    fret: number;
    position: number;
    technique?: string;
    targetFret?: number;
  }[],
  duration: string,
  tempo: number
): Promise<void> {
  if (Tone.getTransport().state === 'started') {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
  Tone.getTransport().position = 0;
  Tone.getTransport().bpm.value = tempo;
  const totalBarTime = durationToTime('1/1', tempo);
  if (!barNotes || barNotes.length === 0) {
    return new Promise((resolve) => {
      Tone.getTransport().schedule(() => {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        resolve();
      }, totalBarTime);
      if (Tone.getTransport().state !== 'started') {
        Tone.getTransport().start();
      }
    });
  }
  const notesByPosition = barNotes.reduce(
    (groups: Record<number, typeof barNotes>, note) => {
      if (!groups[note.position]) {
        groups[note.position] = [];
      }
      groups[note.position].push(note);
      return groups;
    },
    {}
  );
  const positions = Object.keys(notesByPosition).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  const timePerPosition = totalBarTime / Math.max(positions.length, 1);
  Tone.getTransport().cancel();
  if (Tone.context.state !== 'running') {
    try {
      await Tone.start();
    } catch (error) {
      // ignore
    }
  }
  return new Promise<void>((resolve) => {
    positions.forEach((pos, index) => {
      const notesAtPosition = notesByPosition[parseInt(pos)];
      const time = index * timePerPosition;
      notesAtPosition.forEach((note) => {
        const scheduledInstrument = currentInstrument;
        const technique = note.technique;
        const baseFret = note.fret;
        const targetFret = note.targetFret;
        const toneNote = fretToNote(note.string, baseFret, scheduledInstrument);
        if (!toneNote) return;
        Tone.getTransport().schedule((scheduleTime) => {
          try {
            const currentSynth = getCurrentSynth();
            const noteDuration = timePerPosition * 0.8;
            if (!technique) {
              playNoteWithBuffer(
                toneNote,
                noteDuration,
                scheduleTime,
                scheduledInstrument
              );
            } else if (technique === 'x') {
              const dampedSynth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                  attack: 0.001,
                  decay: 0.05,
                  sustain: 0.01,
                  release: 0.1,
                },
              }).toDestination();
              dampedSynth.triggerAttackRelease(
                toneNote,
                noteDuration * 0.2,
                scheduleTime
              );
              setTimeout(
                () => dampedSynth.dispose(),
                (scheduleTime - Tone.now() + noteDuration) * 1000
              );
            } else if (technique === 'h' || technique === 'p') {
              const actualTargetFret =
                targetFret || baseFret + (technique === 'h' ? 2 : -2);
              const targetNote = fretToNote(
                note.string,
                actualTargetFret,
                scheduledInstrument
              );
              if (!targetNote) {
                playNoteWithBuffer(
                  toneNote,
                  noteDuration,
                  scheduleTime,
                  scheduledInstrument
                );
                return;
              }
              playNoteWithBuffer(
                toneNote,
                noteDuration * 0.3,
                scheduleTime,
                scheduledInstrument
              );
              const synth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                  attack: technique === 'h' ? 0.001 : 0.02,
                  decay: 0.1,
                  sustain: 0.7,
                  release: 0.8,
                },
              }).toDestination();
              synth.triggerAttackRelease(
                targetNote,
                noteDuration * 0.7,
                scheduleTime + noteDuration * 0.3
              );
              setTimeout(
                () => synth.dispose(),
                (scheduleTime - Tone.now() + noteDuration + 0.1) * 1000
              );
            } else if (technique === 'b' || technique === 'br') {
              const actualTargetFret = targetFret || baseFret + 2;
              const targetNote = fretToNote(
                note.string,
                actualTargetFret,
                scheduledInstrument
              );
              if (!targetNote) {
                playNoteWithBuffer(
                  toneNote,
                  noteDuration,
                  scheduleTime,
                  scheduledInstrument
                );
                return;
              }
              const bendSynth = new Tone.Synth().toDestination();
              bendSynth.triggerAttack(toneNote, scheduleTime);
              const startFreq = Tone.Frequency(toneNote).toFrequency();
              const endFreq = Tone.Frequency(targetNote).toFrequency();
              bendSynth.frequency.setValueAtTime(startFreq, scheduleTime);
              if (technique === 'b') {
                bendSynth.frequency.linearRampToValueAtTime(
                  endFreq,
                  scheduleTime + noteDuration * 0.5
                );
                bendSynth.triggerRelease(scheduleTime + noteDuration);
              } else {
                bendSynth.frequency.linearRampToValueAtTime(
                  endFreq,
                  scheduleTime + noteDuration * 0.4
                );
                bendSynth.frequency.linearRampToValueAtTime(
                  startFreq,
                  scheduleTime + noteDuration * 0.8
                );
                bendSynth.triggerRelease(scheduleTime + noteDuration);
              }
              setTimeout(
                () => bendSynth.dispose(),
                (scheduleTime - Tone.now() + noteDuration + 0.2) * 1000
              );
            } else if (technique === '/' || technique === '\\') {
              const direction = technique === '/' ? 1 : -1;
              const actualTargetFret = targetFret || baseFret + 2 * direction;
              const targetNote = fretToNote(
                note.string,
                actualTargetFret,
                scheduledInstrument
              );
              if (!targetNote) {
                playNoteWithBuffer(
                  toneNote,
                  noteDuration,
                  scheduleTime,
                  scheduledInstrument
                );
                return;
              }
              const slideSynth = new Tone.Synth().toDestination();
              slideSynth.triggerAttack(toneNote, scheduleTime);
              const startFreq = Tone.Frequency(toneNote).toFrequency();
              const endFreq = Tone.Frequency(targetNote).toFrequency();
              slideSynth.frequency.setValueAtTime(startFreq, scheduleTime);
              slideSynth.frequency.linearRampToValueAtTime(
                endFreq,
                scheduleTime + noteDuration * 0.8
              );
              slideSynth.triggerRelease(scheduleTime + noteDuration);
              setTimeout(
                () => slideSynth.dispose(),
                (scheduleTime - Tone.now() + noteDuration + 0.2) * 1000
              );
            } else if (technique === 'v' || technique === '~') {
              const vibratoSynth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                  attack: 0.01,
                  decay: 0.1,
                  sustain: 0.8,
                  release: 0.8,
                },
              }).toDestination();
              const baseFreq = Tone.Frequency(toneNote).toFrequency();
              vibratoSynth.triggerAttack(toneNote, scheduleTime);
              const vibrato = new Tone.LFO({
                frequency: 6,
                min: baseFreq * 0.98,
                max: baseFreq * 1.02,
              })
                .connect(vibratoSynth.frequency)
                .start(scheduleTime);
              vibratoSynth.triggerRelease(scheduleTime + noteDuration);
              setTimeout(() => {
                vibrato.dispose();
                vibratoSynth.dispose();
              }, (scheduleTime - Tone.now() + noteDuration + 0.2) * 1000);
            } else {
              playNoteWithBuffer(
                toneNote,
                noteDuration,
                scheduleTime,
                scheduledInstrument
              );
            }
          } catch (error) {
            try {
              const currentSynth = getCurrentSynth();
              if (currentSynth && toneNote) {
                currentSynth.triggerAttackRelease(
                  toneNote,
                  timePerPosition * 0.8,
                  scheduleTime
                );
              }
            } catch (fallbackError) {}
          }
        }, time);
      });
    });
    Tone.getTransport().schedule((time) => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      resolve();
    }, totalBarTime);
    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start();
    }
  });
}

// Direct playback method that doesn't use the Transport
async function playBarDirect(
  barNotes: {
    string: number;
    fret: number;
    position: number;
    technique?: string;
    targetFret?: number;
  }[],
  duration: string,
  tempo: number
): Promise<void> {
  if (Tone.context.state !== 'running') {
    try {
      await Tone.start();
    } catch (error) {
      return;
    }
  }
  const noteDuration = durationToTime(duration, tempo);
  if (!barNotes || barNotes.length === 0) {
    return;
  }
  const normalizedNotes = [...barNotes].map((note, index) => {
    if (note.position === undefined || note.position < 0) {
      return { ...note, position: index * 2 };
    }
    return note;
  });
  const notesByPosition = normalizedNotes.reduce(
    (groups: Record<number, typeof barNotes>, note) => {
      const key = note.position;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(note);
      return groups;
    },
    {}
  );
  const positions = Object.keys(notesByPosition)
    .map(Number)
    .sort((a, b) => a - b);
  const startTime = Tone.now();
  let delay = 0;
  const positionDelay = noteDuration * 0.5;
  for (const position of positions) {
    const notesAtPosition = notesByPosition[position];
    const timeToPlay = startTime + delay;
    for (const note of notesAtPosition) {
      const technique = note.technique;
      const string = note.string;
      const fret = note.fret;
      let targetFret = note.targetFret;
      if (
        technique &&
        ['h', 'p', 'b', 'br', '/', '\\'].includes(technique) &&
        targetFret === undefined
      ) {
        if (technique === 'h') targetFret = fret + 2;
        else if (technique === 'p') targetFret = fret - 2;
        else if (technique === 'b' || technique === 'br') targetFret = fret + 2;
        else if (technique === '/') targetFret = fret + 2;
        else if (technique === '\\') targetFret = fret - 2;
      }
      const toneNote = fretToNote(string, fret, currentInstrument);
      if (!toneNote) continue;
      try {
        if (!technique) {
          const synth = new Tone.Synth().toDestination();
          synth.triggerAttackRelease(toneNote, positionDelay, timeToPlay);
          setTimeout(() => synth.dispose(), (positionDelay + 0.5) * 1000);
        } else if (technique === 'x') {
          const dampedSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: {
              attack: 0.001,
              decay: 0.05,
              sustain: 0.01,
              release: 0.1,
            },
          }).toDestination();
          dampedSynth.triggerAttackRelease(
            toneNote,
            positionDelay * 0.2,
            timeToPlay
          );
          setTimeout(() => dampedSynth.dispose(), (positionDelay + 0.5) * 1000);
        } else if (technique === 'h' || technique === 'p') {
          if (targetFret !== undefined) {
            const targetNote = fretToNote(
              string,
              targetFret,
              currentInstrument
            );
            if (targetNote) {
              const firstSynth = new Tone.Synth().toDestination();
              firstSynth.triggerAttackRelease(
                toneNote,
                positionDelay * 0.3,
                timeToPlay
              );
              const secondSynth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                  attack: technique === 'h' ? 0.001 : 0.02,
                  decay: 0.1,
                  sustain: 0.7,
                  release: 0.4,
                },
              }).toDestination();
              secondSynth.triggerAttackRelease(
                targetNote,
                positionDelay * 0.6,
                timeToPlay + positionDelay * 0.35
              );
              setTimeout(() => {
                firstSynth.dispose();
                secondSynth.dispose();
              }, (positionDelay + 1) * 1000);
            }
          } else {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(toneNote, positionDelay, timeToPlay);
            setTimeout(() => synth.dispose(), (positionDelay + 0.5) * 1000);
          }
        } else if (technique === 'b' || technique === 'br') {
          if (targetFret !== undefined) {
            const targetNote = fretToNote(
              string,
              targetFret,
              currentInstrument
            );
            if (targetNote) {
              const bendSynth = new Tone.Synth().toDestination();
              bendSynth.triggerAttack(toneNote, timeToPlay);
              const startFreq = Tone.Frequency(toneNote).toFrequency();
              const endFreq = Tone.Frequency(targetNote).toFrequency();
              bendSynth.frequency.setValueAtTime(startFreq, timeToPlay);
              bendSynth.frequency.linearRampToValueAtTime(
                endFreq,
                timeToPlay + positionDelay * 0.4
              );
              if (technique === 'br') {
                bendSynth.frequency.linearRampToValueAtTime(
                  startFreq,
                  timeToPlay + positionDelay * 0.8
                );
              }
              bendSynth.triggerRelease(timeToPlay + positionDelay);
              setTimeout(
                () => bendSynth.dispose(),
                (positionDelay + 0.5) * 1000
              );
            }
          } else {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(toneNote, positionDelay, timeToPlay);
            setTimeout(() => synth.dispose(), (positionDelay + 0.5) * 1000);
          }
        } else if (technique === '/' || technique === '\\') {
          if (targetFret !== undefined) {
            const targetNote = fretToNote(
              string,
              targetFret,
              currentInstrument
            );
            if (targetNote) {
              const slideSynth = new Tone.Synth().toDestination();
              slideSynth.triggerAttack(toneNote, timeToPlay);
              const startFreq = Tone.Frequency(toneNote).toFrequency();
              const endFreq = Tone.Frequency(targetNote).toFrequency();
              slideSynth.frequency.setValueAtTime(startFreq, timeToPlay);
              slideSynth.frequency.linearRampToValueAtTime(
                endFreq,
                timeToPlay + positionDelay * 0.8
              );
              slideSynth.triggerRelease(timeToPlay + positionDelay);
              setTimeout(
                () => slideSynth.dispose(),
                (positionDelay + 0.5) * 1000
              );
            }
          } else {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(toneNote, positionDelay, timeToPlay);
            setTimeout(() => synth.dispose(), (positionDelay + 0.5) * 1000);
          }
        } else if (technique === 'v' || technique === '~') {
          const vibratoSynth = new Tone.Synth().toDestination();
          vibratoSynth.triggerAttack(toneNote, timeToPlay);
          const baseFreq = Tone.Frequency(toneNote).toFrequency();
          const vibrato = new Tone.LFO({
            frequency: 6,
            min: baseFreq * 0.98,
            max: baseFreq * 1.02,
          })
            .connect(vibratoSynth.frequency)
            .start(timeToPlay);
          vibratoSynth.triggerRelease(timeToPlay + positionDelay);
          setTimeout(() => {
            vibrato.dispose();
            vibratoSynth.dispose();
          }, (positionDelay + 0.5) * 1000);
        } else {
          const synth = new Tone.Synth().toDestination();
          synth.triggerAttackRelease(toneNote, positionDelay, timeToPlay);
          setTimeout(() => synth.dispose(), (positionDelay + 0.5) * 1000);
        }
      } catch (error) {
        try {
          const fallbackSynth = new Tone.Synth().toDestination();
          fallbackSynth.triggerAttackRelease(
            toneNote,
            positionDelay,
            timeToPlay
          );
          setTimeout(
            () => fallbackSynth.dispose(),
            (positionDelay + 0.5) * 1000
          );
        } catch (fallbackError) {}
      }
    }
    delay += positionDelay;
  }
  return new Promise((resolve) => {
    setTimeout(resolve, delay * 1000 + 500);
  });
}

// Stop all playback
function stopPlayback(): void {
  if (Tone.getTransport().state === 'started') {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
  Tone.getTransport().position = 0;
  const synth = getCurrentSynth();
  if (synth && typeof synth.releaseAll === 'function') synth.releaseAll();
}

export {
  playNoteWithBuffer,
  playNote,
  playChord,
  playBar,
  playBarDirect,
  stopPlayback,
};
