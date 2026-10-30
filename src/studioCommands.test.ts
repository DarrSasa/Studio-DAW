import { describe, expect, it } from 'vitest';
import { parseStudioCommands } from './studioCommands';

describe('parseStudioCommands', () => {
  it('parses the requested Romanian BPM and key command', () => {
    expect(parseStudioCommands('pune bpm la 88, cheia la F# min.'))
      .toEqual({ bpm: 88, key: 'F#', scale: 'Minor' });
  });

  it('supports a tempo-only command and common English phrasing', () => {
    expect(parseStudioCommands('set tempo to 132')).toEqual({ bpm: 132 });
    expect(parseStudioCommands('change key to Bb major')).toEqual({ key: 'A#', scale: 'Major' });
  });

  it('does not invent a command for ordinary questions or invalid tempo values', () => {
    expect(parseStudioCommands('Ce BPM ar merge pentru piesa asta?')).toBeNull();
    expect(parseStudioCommands('pune BPM la 300')).toBeNull();
  });
});
