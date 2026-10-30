export type StudioCommand = {
  bpm?: number;
  key?: string;
  scale?: 'Major' | 'Minor';
};

const SHARP_EQUIVALENTS: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
};

/** Parses only explicit, supported project-setting commands; it never guesses. */
export function parseStudioCommands(message: string): StudioCommand | null {
  if (!/\b(pune|seteaz[aă]|schimb[aă]|modific[aă]|set|change|make|put|adjust)\b/i.test(message)) return null;
  const command: StudioCommand = {};
  const bpmMatch = message.match(/\b(?:bpm|tempo)\s*(?:(?:la|to|este|=|:)\s*)?(\d{2,3})\b/i)
    ?? message.match(/\b(\d{2,3})\s*bpm\b/i);
  if (bpmMatch) {
    const bpm = Number(bpmMatch[1]);
    if (bpm >= 40 && bpm <= 240) command.bpm = bpm;
  }

  const keyMatch = message.match(/\b(?:cheia|tonalitatea|key)\s*(?:(?:la|este|to|=|:)\s*)?([A-G])\s*([#b]?)(?:\s*(major|minor|maj|min))?(?![A-Za-z])/i);
  if (keyMatch) {
    const written = `${keyMatch[1].toUpperCase()}${keyMatch[2]}`;
    command.key = SHARP_EQUIVALENTS[written] ?? written;
    const mode = keyMatch[3]?.toLowerCase();
    if (mode) command.scale = mode.startsWith('min') ? 'Minor' : 'Major';
  } else {
    const scaleMatch = message.match(/\b(?:gama|scale)\s*(?:(?:la|este|to|=|:)\s*)?(major|minor|maj|min)\b/i);
    if (scaleMatch) command.scale = scaleMatch[1].toLowerCase().startsWith('min') ? 'Minor' : 'Major';
  }

  return Object.keys(command).length ? command : null;
}
