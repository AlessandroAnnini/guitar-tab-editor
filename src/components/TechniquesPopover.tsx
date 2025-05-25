import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const TechniquesPopover: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1">
          <span className="sr-only">Show techniques info</span>
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
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-2">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Supported Techniques</h4>
            <p className="text-sm text-muted-foreground">
              Use these techniques in your tab:
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            <div>
              <strong>h</strong> - Hammer-on (e.g., 5h7)
            </div>
            <div>
              <strong>p</strong> - Pull-off (e.g., 7p5)
            </div>
            <div>
              <strong>b</strong> - Bend string up (e.g., 7b9)
            </div>
            <div>
              <strong>br</strong> - Bend and release (e.g., 7b9r7)
            </div>
            <div>
              <strong>/</strong> - Slide up (e.g., 5/7)
            </div>
            <div>
              <strong>\</strong> - Slide down (e.g., 7\5)
            </div>
            <div>
              <strong>v</strong> or <strong>~</strong> - Vibrato (e.g., 7v or
              7~)
            </div>
            <div>
              <strong>x</strong> - Damped/dead note (e.g., x)
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TechniquesPopover;
