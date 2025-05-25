import type { Block, TabMetadata } from '@/types';

// Define types for tab parsing
interface Note {
  string: number;
  fret: number;
  position: number;
  // Add techniques
  technique?: string;
  targetFret?: number; // For techniques like bends and slides that have a target
}

interface ParsedTab {
  notes: Note[][];
  bars: number;
}

// Utility for processing tab notation
const tabUtils = {
  // Parse tab content to extract notes, positions, and durations
  parseTab: (tabContent: string): ParsedTab => {
    if (!tabContent) {
      return { notes: [], bars: 0 };
    }

    const lines = tabContent.trim().split('\n');

    if (lines.length !== 6) {
      return { notes: [], bars: 0 };
    }

    const barSeparator = '|';
    const stringLines = lines.map((line: string) => {
      const stringParts = line.split(barSeparator);

      // Handle case where there might not be proper bar separators
      if (stringParts.length <= 1) {
        return [];
      }

      // Return parts between first and last separators
      return stringParts.slice(1, stringParts.length - 1);
    });

    // Check if any string line is empty
    if (stringLines.some((line: string[]) => line.length === 0)) {
      return { notes: [], bars: 0 };
    }

    const numBars = stringLines[0].length;
    const notes: Note[][] = [];

    for (let barIndex = 0; barIndex < numBars; barIndex++) {
      const barNotes: Note[] = [];

      for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        if (!stringLines[stringIndex] || !stringLines[stringIndex][barIndex])
          continue;

        const bar = stringLines[stringIndex][barIndex] || '';
        // Find all note positions in this bar for this string
        let pos = 0;

        while (pos < bar.length) {
          // Look for digits (fret numbers)
          if (!isNaN(parseInt(bar[pos]))) {
            // Found a note
            let fretNum = '';
            const startPos = pos;

            while (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
              fretNum += bar[pos];
              pos++;
            }

            // Check for techniques after the fret number
            let technique = null;
            let targetFret = null;

            // Look for techniques
            if (pos < bar.length) {
              const techChar = bar[pos];

              // Techniques that don't require additional parsing
              if (
                techChar === 'h' ||
                techChar === 'p' ||
                techChar === 'v' ||
                techChar === '~'
              ) {
                technique = techChar;
                pos++;
              }
              // Damped note
              else if (techChar === 'x' || techChar === 'X') {
                technique = 'x';
                pos++;
              }
              // Slide up
              else if (techChar === '/') {
                technique = '/';
                pos++;
                // Check for target fret after slide
                if (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                  let targetFretNum = '';
                  while (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                    targetFretNum += bar[pos];
                    pos++;
                  }
                  targetFret = parseInt(targetFretNum);
                }
              }
              // Slide down
              else if (techChar === '\\') {
                technique = '\\';
                pos++;
                // Check for target fret after slide
                if (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                  let targetFretNum = '';
                  while (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                    targetFretNum += bar[pos];
                    pos++;
                  }
                  targetFret = parseInt(targetFretNum);
                }
              }
              // Bend
              else if (techChar === 'b') {
                technique = 'b';
                pos++;
                // Check for target fret after bend
                if (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                  let targetFretNum = '';
                  while (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                    targetFretNum += bar[pos];
                    pos++;
                  }
                  targetFret = parseInt(targetFretNum);
                }

                // Check for release after bend
                if (pos < bar.length && bar[pos] === 'r') {
                  technique = 'br'; // bend and release
                  pos++;
                  // Check for release target fret
                  if (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                    let releaseFretNum = '';
                    while (pos < bar.length && !isNaN(parseInt(bar[pos]))) {
                      releaseFretNum += bar[pos];
                      pos++;
                    }
                    // We'll stick with the original fret as the release target
                    // but this could be extended to support custom release targets
                  }
                }
              }
            }

            // Create the note with technique data
            const note: Note = {
              string: 5 - stringIndex, // 0 is high E, 5 is low E
              fret: parseInt(fretNum),
              position: startPos, // Use the starting position for consistent alignment
            };

            // Add technique if present
            if (technique) {
              note.technique = technique;
              if (targetFret !== null) {
                note.targetFret = targetFret;
              }
            }

            barNotes.push(note);
          } else {
            pos++;
          }
        }
      }

      notes.push(barNotes);
    }

    return {
      notes,
      bars: numBars,
    };
  },

  // Count the number of bars in tab content
  countBars: (tabContent: string): number => {
    if (!tabContent) return 0;

    const lines = tabContent.trim().split('\n');
    if (lines.length === 0) return 0;

    // Count the number of '|' characters in the first line and subtract 1
    const matches = lines[0].match(/\|/g);
    return matches ? Math.max(0, matches.length - 1) : 0;
  },

  // Normalize tab lines to ensure all strings have the same length and proper ending
  normalizeTabLines: (tabContent: string): string => {
    if (!tabContent) return tabContent;

    // Split content into lines
    const lines = tabContent.trim().split('\n');
    if (lines.length !== 6) return tabContent; // Not a valid tab format

    // Parse lines to extract the parts between the "|" characters
    const parsedLines = lines.map((line: string) => {
      const parts = line.split('|');
      if (parts.length < 3) {
        // Ensure we have at least: [string name] | [content] |
        return {
          prefix: parts[0],
          content: parts.length > 1 ? parts[1] : '',
          suffix: '',
        };
      }
      return {
        prefix: parts[0], // String name (e, B, G, D, A, E)
        content: parts.slice(1, parts.length - 1).join('|'), // Content between first and last |
        suffix: '', // Will be filled with padding
      };
    });

    // Find the longest content
    let maxContentLength = 0;
    for (const line of parsedLines) {
      maxContentLength = Math.max(maxContentLength, line.content.length);
    }

    // Pad each line's content to match the longest
    const normalizedLines = parsedLines.map(
      (line: { prefix: string; content: string; suffix: string }) => {
        // Pad content with "-" characters to match maxContentLength
        const paddedContent =
          line.content +
          '-'.repeat(Math.max(0, maxContentLength - line.content.length));
        // Return the normalized line with proper ending |
        return `${line.prefix}|${paddedContent}|`;
      }
    );

    // Join lines back into a single string
    return normalizedLines.join('\n');
  },

  // Generate clean tab with the specified number of bars
  generateEmptyTab: (bars = 1, tuning = 'E A D G B E'): string => {
    const barContent = '-'.repeat(20);
    let tab = '';

    // Get tuning notes in high to low order
    const tuningNotes = tuning.split(' ');
    if (tuningNotes.length !== 6) {
      // Fallback to standard tuning if invalid
      return tabUtils.generateEmptyTab(bars);
    }

    // Generate tab in standard order (high to low)
    const strings = [
      tuningNotes[5].toLowerCase(), // Highest string
      tuningNotes[4],
      tuningNotes[3],
      tuningNotes[2],
      tuningNotes[1],
      tuningNotes[0].toLowerCase(), // Lowest string
    ];

    strings.forEach((string) => {
      tab += `${string}|`;
      for (let i = 0; i < bars; i++) {
        tab += `${barContent}|`;
      }
      tab += '\n';
    });

    return tab;
  },

  // Create a formatted export string with metadata and content
  createExport: (blocks: Block[], metadata: TabMetadata): string => {
    // Create YAML-like metadata header
    let exportString = '---\n';
    exportString += `title: "${metadata.title}"\n`;
    exportString += `tuning: "${metadata.tuning}"\n`;
    exportString += `spacing: ${metadata.spacing}\n`;
    exportString += `instrument: "${metadata.instrument}"\n`;
    exportString += 'blocks:\n';

    blocks.forEach((block) => {
      exportString += `  - type: "${block.type}"\n`;
      if (block.type === 'tab') {
        exportString += `    tempo: ${block.tempo}\n`;
        exportString += `    duration: "${block.duration}"\n`;
        exportString += `    bars: ${
          block.bars || tabUtils.countBars(block.content)
        }\n`;
      }
    });

    exportString += '---\n\n';

    // Add block content
    blocks.forEach((block) => {
      if (block.type === 'text') {
        exportString += `[TEXT]\n${block.content}\n[/TEXT]\n\n`;
      } else if (block.type === 'tab') {
        exportString += `[TAB tempo=${block.tempo} duration=${block.duration}]\n${block.content}[/TAB]\n\n`;
      }
    });

    return exportString;
  },

  // Parse imported string back into blocks and metadata
  parseImport: (
    importString: string
  ): { blocks: Block[]; metadata: TabMetadata } | null => {
    try {
      // Split the import string into metadata and content sections
      const [_, metadataStr, contentStr] =
        importString.match(/---(.*?)---\s*(.*)/s) || [];

      if (!metadataStr || !contentStr) {
        throw new Error('Invalid import format');
      }

      // Parse metadata
      const metadata: TabMetadata = {
        title: '',
        tuning: 'E A D G B E',
        spacing: 1,
        instrument: 'acoustic',
      };

      // Extract metadata properties
      const titleMatch = metadataStr.match(/title:\s*"([^"]*)"/);
      if (titleMatch) metadata.title = titleMatch[1];

      const tuningMatch = metadataStr.match(/tuning:\s*"([^"]*)"/);
      if (tuningMatch) metadata.tuning = tuningMatch[1];

      const spacingMatch = metadataStr.match(/spacing:\s*(\d+)/);
      if (spacingMatch) metadata.spacing = parseInt(spacingMatch[1]);

      const instrumentMatch = metadataStr.match(/instrument:\s*"([^"]*)"/);
      if (instrumentMatch) metadata.instrument = instrumentMatch[1];

      // Parse blocks
      const blocks: Block[] = [];

      // Match text blocks
      const textBlockRegex = /\[TEXT\](.*?)\[\/TEXT\]/gs;
      let textMatch;
      while ((textMatch = textBlockRegex.exec(contentStr)) !== null) {
        blocks.push({
          id: Date.now().toString() + blocks.length,
          type: 'text',
          content: textMatch[1].trim(),
        });
      }

      // Match tab blocks
      const tabBlockRegex =
        /\[TAB tempo=(\d+) duration=([^\]]+)\](.*?)\[\/TAB\]/gs;
      let tabMatch;
      while ((tabMatch = tabBlockRegex.exec(contentStr)) !== null) {
        const tempo = parseInt(tabMatch[1]);
        const duration = tabMatch[2];
        const content = tabMatch[3].trim();
        const bars = tabUtils.countBars(content);

        blocks.push({
          id: Date.now().toString() + blocks.length,
          type: 'tab',
          content,
          tempo,
          duration,
          bars,
        });
      }

      // Sort blocks by their position in the original string
      blocks.sort((a, b) => {
        const posA = contentStr.indexOf(`[${a.type.toUpperCase()}`);
        const posB = contentStr.indexOf(`[${b.type.toUpperCase()}`);
        return posA - posB;
      });

      return {
        blocks,
        metadata,
      };
    } catch (error) {
      console.error('Import parsing error:', error);
      return null;
    }
  },
};

export default tabUtils;
