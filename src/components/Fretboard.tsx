import React from 'react';
import { Button } from '@/components/ui/button';

interface FretboardProps {
  onFretClick: (string: number, fret: number) => void;
  tuning?: string[];
}

const Fretboard: React.FC<FretboardProps> = ({
  onFretClick,
  tuning = ['E', 'A', 'D', 'G', 'B', 'E'],
}) => {
  // Make sure we have proper reversed order for display (high E to low E)
  const displayTuning = [...tuning].reverse();

  const getStringBackground = (stringIndex: number) => {
    // First pair (0-1) and last pair (4-5): slate background
    // Middle pair (2-3): blue background
    if (stringIndex < 2 || stringIndex >= 4) {
      return 'bg-slate-50 dark:bg-slate-800/50';
    }
    return 'bg-blue-50 dark:bg-blue-900/30';
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded p-2 bg-background">
        {[...Array(6)].map((_, string) => (
          <div
            key={string}
            className={`flex items-center mb-1 rounded-sm ${getStringBackground(
              string
            )} hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors`}>
            <span className="w-6 text-xs font-mono font-bold text-foreground px-1">
              {displayTuning[string]}
            </span>
            <div className="flex-1 flex">
              {[...Array(23)].map((_, fret) => (
                <Button
                  key={fret}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 m-0.5 text-xs hover:bg-primary/10 dark:hover:bg-primary/20 border-border/50 text-foreground"
                  onClick={() => onFretClick(string, fret)}>
                  {fret}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Click a fret number to insert it at the cursor position
      </div>
    </div>
  );
};

export default Fretboard;