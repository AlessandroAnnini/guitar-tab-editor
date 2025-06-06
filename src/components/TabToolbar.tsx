import React from 'react';
import {
  // Play, Square, FileDown, FileUp,
  Settings,
  // Copy
} from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

// Import shadcn components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  // DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import type { TabToolbarProps } from '../types';

// TabToolbar component for the top bar with title and buttons
const TabToolbar: React.FC<TabToolbarProps> = ({
  title,
  tuning,
  instrument,
  onUpdateMetadata,
  // onPlayAll,
  // onStopPlayback,
  // importOpen,
  // setImportOpen,
  // exportOpen,
  // setExportOpen,
  settingsOpen,
  setSettingsOpen,
  // importText,
  // setImportText,
  // exportText,
  // handleImport,
  // handleCopyExport,
  // handleDownloadExport,
  // isPlaying,
  // hasTabBlocks,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">{title || 'Untitled Tab'}</h1>

      <div className="flex space-x-2">
        <ModeToggle />
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tab Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tab Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => onUpdateMetadata({ title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tuning">Tuning</Label>
                <Select
                  value={tuning}
                  onValueChange={(value) =>
                    onUpdateMetadata({ tuning: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E A D G B E">
                      Standard (E A D G B E)
                    </SelectItem>
                    <SelectItem value="D A D G B E">
                      Drop D (D A D G B E)
                    </SelectItem>
                    <SelectItem value="C G C F A D">
                      Drop C (C G C F A D)
                    </SelectItem>
                    <SelectItem value="D G C F A D">
                      Full Step Down (D G C F A D)
                    </SelectItem>
                    <SelectItem value="E B E A C# E">
                      Open E (E B E G# B E)
                    </SelectItem>
                    <SelectItem value="D A D F# A D">
                      Open D (D A D F# A D)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instrument">Instrument Type</Label>
                <Select
                  value={instrument}
                  onValueChange={(value) =>
                    onUpdateMetadata({ instrument: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acoustic">Acoustic Guitar</SelectItem>
                    <SelectItem value="electric">Electric Guitar</SelectItem>
                    <SelectItem value="bass">Bass Guitar</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileUp className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Import Tab</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="import-text">Paste tab data</Label>
              <Textarea
                id="import-text"
                className="font-mono h-64"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported tab data here..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        {/* <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Export Tab</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-2 bg-gray-50 rounded-md">
                <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                  {exportText}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCopyExport}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={handleDownloadExport}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        {/* {!isPlaying ? (
          <Button
            size="sm"
            variant="default"
            onClick={onPlayAll}
            disabled={!hasTabBlocks}>
            <Play className="h-4 w-4 mr-2" />
            Play All
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={onStopPlayback}>
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        )} */}
      </div>
    </div>
  );
};

// At the end of the file, add this custom comparison function and export with memo
const areEqual = (prevProps: TabToolbarProps, nextProps: TabToolbarProps) => {
  // Compare simple primitive props that would cause re-renders
  if (
    prevProps.title !== nextProps.title ||
    prevProps.tuning !== nextProps.tuning ||
    prevProps.instrument !== nextProps.instrument ||
    prevProps.isPlaying !== nextProps.isPlaying ||
    prevProps.hasTabBlocks !== nextProps.hasTabBlocks ||
    prevProps.importOpen !== nextProps.importOpen ||
    prevProps.exportOpen !== nextProps.exportOpen ||
    prevProps.settingsOpen !== nextProps.settingsOpen ||
    prevProps.importText !== nextProps.importText ||
    prevProps.exportText !== nextProps.exportText
  ) {
    return false;
  }

  // If nothing relevant changed, prevent re-render
  return true;
};

export default React.memo(TabToolbar, areEqual);
