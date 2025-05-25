import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const ShiftClickPopover: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1">
          <span className="sr-only">Show keyboard shortcuts</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3">
            <circle cx="12" cy="12" r="10" />
            <text
              x="12"
              y="16"
              fontSize="11"
              textAnchor="middle"
              fill="currentColor"
              stroke="none">
              S
            </text>
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-2">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Keyboard Shortcuts</h4>
            <p className="text-sm text-muted-foreground">
              Special key modifiers when using the fretboard:
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            <div>
              <strong>SHIFT + Click</strong> - Write chord notes in the same
              column
            </div>
            <div className="text-muted-foreground">
              Hold SHIFT while clicking fret numbers to keep the cursor in the
              same column. This makes it easy to build chords by adding notes
              vertically aligned.
            </div>
            <div className="mt-1 border-l-2 border-blue-200 pl-2 py-1 bg-blue-50">
              <strong>Example:</strong> Hold SHIFT and click fret 3 on the 1st
              string, then fret 2 on the 2nd string, then fret 0 on the 3rd
              string to quickly write an open G chord.
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShiftClickPopover;
