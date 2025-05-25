import React from 'react';
import { Button } from '@/components/ui/button';

interface FretboardProps {
  currentBar: number;
  totalBars: number;
  onFretClick: (string: number, fret: number) => void;
  onBarChange: (newBar: number) => void;
  tuning?: string[];
}

const Fretboard: React.FC<FretboardProps> = ({
  currentBar,
  totalBars,
  onFretClick,
  onBarChange,
  tuning = ['E', 'A', 'D', 'G', 'B', 'E'],
}) => {
  // Make sure we have proper reversed order for display (high E to low E)
  const displayTuning = [...tuning].reverse();

  const getStringBackground = (stringIndex: number) => {
    // First pair (0-1) and last pair (4-5): slate background
    // Middle pair (2-3): gray background
    if (stringIndex < 2 || stringIndex >= 4) {
      return 'bg-slate-50';
    }
    return 'bg-blue-50';
  };

  return (
    <div className="space-y-2">
      <div className="border rounded p-2">
        {[...Array(6)].map((_, string) => (
          <div
            key={string}
            className={`flex items-center mb-1 ${getStringBackground(
              string
            )} hover:bg-gray-100`}>
            <span className="w-6 text-xs font-mono font-bold">
              {displayTuning[string]}
            </span>
            <div className="flex-1 flex">
              {[...Array(23)].map((_, fret) => (
                <Button
                  key={fret}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 m-0.5 text-xs hover:bg-blue-100"
                  onClick={() => onFretClick(string, fret)}>
                  {fret}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Click a fret number to insert it at the cursor position
      </div>
    </div>
  );
};

export default Fretboard;
