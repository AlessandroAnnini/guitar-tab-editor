import React from 'react';
import { version } from '../../package.json';

const Attribution: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors shadow-lg">
        <div className="flex flex-col items-end gap-0.5 text-right">
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>by</span>
          </div>
          <a
            href="https://alessandroannini.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            Alessandro Annini
          </a>
          <div className="text-muted-foreground/70 text-[10px] font-mono">
            v{version}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attribution;
