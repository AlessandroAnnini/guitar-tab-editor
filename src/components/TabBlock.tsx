import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  // Play,
  // Square,
  Settings,
  Music,
  Text,
  Copy,
  Edit,
  AlignJustify,
} from 'lucide-react';

// Import shadcn components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

import type { TabBlockProps } from '../types';
import tabUtils from '@/utils/tabUtils';
import audioUtils from '@/audio-utils';
import Fretboard from './Fretboard';
import TechniquesPopover from './TechniquesPopover';
import ShiftClickPopover from './ShiftClickPopover';

// Main tab block component
const TabBlock: React.FC<TabBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onMove,
  // isPlaying,
  // onPlay,
  // onStop,
  isActive,
  setActive,
  onAddBlock,
  tuning,
  onDuplicate,
}) => {
  const [editing, setEditing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [currentContent, setCurrentContent] = useState(block.content || '');
  const [currentTuning, setCurrentTuning] = useState(tuning);

  // Add refs for cursor position tracking
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // Add state to track if shift key is pressed
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);

  // Update local state when block content changes
  useEffect(() => {
    setCurrentContent(block.content || '');
  }, [block.content]);

  // Update content when tuning changes
  useEffect(() => {
    if (tuning !== currentTuning) {
      // Parse the current content into lines
      const lines = currentContent.split('\n');
      if (lines.length === 6) {
        // Get the tuning notes
        const tuningNotes = tuning.split(' ');

        // Ensure we have 6 notes in the tuning
        if (tuningNotes.length === 6) {
          // Update each string's name based on the new tuning (in reverse order for guitar tab)
          const updatedLines = [
            tuningNotes[5].toLowerCase() + lines[0].substring(1), // High E string (or equivalent)
            tuningNotes[4] + lines[1].substring(1), // B string (or equivalent)
            tuningNotes[3] + lines[2].substring(1), // G string (or equivalent)
            tuningNotes[2] + lines[3].substring(1), // D string (or equivalent)
            tuningNotes[1] + lines[4].substring(1), // A string (or equivalent)
            tuningNotes[0].toLowerCase() + lines[5].substring(1), // Low E string (or equivalent)
          ];

          // Update the content and save it
          const updatedContent = updatedLines.join('\n');
          setCurrentContent(updatedContent);
          onUpdate(block.id, { content: updatedContent });

          // Update current tuning reference
          setCurrentTuning(tuning);
        }
      }
    }
  }, [tuning, currentTuning, currentContent, block.id, onUpdate]);

  useEffect(() => {
    // Parse tab on mount or when content changes
    try {
      // Update bars count if needed
      const bars = tabUtils.countBars(block.content);
      if (bars !== block.bars) {
        onUpdate(block.id, { bars });
      }
    } catch (error) {
      console.error('Error parsing tab:', error);
    }
  }, [block.content, block.bars, block.id, onUpdate]);

  // Add event listeners for shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(false);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentContent(e.target.value);
    // Save cursor position on every change
    const target = e.target;
    cursorPositionRef.current = {
      start: target.selectionStart || 0,
      end: target.selectionEnd || 0,
    };
  };

  // Add function to track cursor position on click/selection
  const handleCursorPosition = () => {
    if (textareaRef.current) {
      cursorPositionRef.current = {
        start: textareaRef.current.selectionStart || 0,
        end: textareaRef.current.selectionEnd || 0,
      };
    }
  };

  const saveContent = () => {
    // Normalize tab lines before saving
    const normalizedContent = tabUtils.normalizeTabLines(currentContent);
    onUpdate(block.id, { content: normalizedContent });
    setCurrentContent(normalizedContent); // Update the editor's content too
    setEditing(false);
  };

  const cancelEditing = () => {
    setCurrentContent(block.content || '');
    setEditing(false);
  };

  const handleTempoChange = (value: number[]) => {
    onUpdate(block.id, { tempo: value[0] || 120 });
  };

  const handleFretClick = (string: number, fret: number) => {
    // Get the current tab content as lines
    const lines = currentContent.split('\n');

    // Find the line for the selected string
    // Now directly mapping fretboard row to tab line (no reverse mapping)
    const lineIndex = string;

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    // Find cursor position within the textarea
    const cursorPos = cursorPositionRef.current.start;
    let currentLineStartPos = 0;

    // Find which line the cursor is on and its position within that line
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for the newline character
      if (currentLineStartPos + lineLength > cursorPos) {
        break;
      }
      currentLineStartPos += lineLength;
    }

    // Calculate the column position within the line
    const columnPos = cursorPos - currentLineStartPos;

    // Insert the fret number at the cursor position in the appropriate string line
    const beforeCursor = lines[lineIndex].substring(0, columnPos);
    const afterCursor = lines[lineIndex].substring(columnPos);
    lines[lineIndex] = beforeCursor + fret + afterCursor;

    // Rebuild the content
    const newContent = lines.join('\n');

    // Calculate the new cursor position
    // We need to find the position after the inserted fret number in the complete text
    let newCursorPos = 0;

    // Calculate position by counting characters up to our insert point plus the length of the inserted fret
    for (let i = 0; i < lineIndex; i++) {
      newCursorPos += lines[i].length + 1; // +1 for newline
    }
    newCursorPos += beforeCursor.length + String(fret).length;

    // If shift key is pressed, move cursor back one character to allow chord writing
    // Only move back if we're not at the start of a line (to prevent moving to previous line)
    if (shiftKeyPressed && beforeCursor.length + String(fret).length > 0) {
      newCursorPos -= 1;
    }

    // Update the content
    setCurrentContent(newContent);
    onUpdate(block.id, { content: newContent });

    // Play the note
    audioUtils.playNote(
      string,
      fret,
      String(audioUtils.durationToTime('1', block.tempo))
    );

    // Set focus back to textarea and place cursor after the inserted fret number
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        // Update cursor position ref
        cursorPositionRef.current = { start: newCursorPos, end: newCursorPos };
      }
    }, 50); // Increased timeout to ensure DOM updates complete
  };

  return (
    <Card
      className={`mb-4 border-2 relative ${isActive ? 'border-blue-400' : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => setActive(block.id)}>
      <CardHeader className="px-3 py-0.5 h-6 border-b flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Music className="h-3 w-3" />
          <Badge className="ml-1 py-0 h-4 text-[10px]">{block.tempo} BPM</Badge>
        </div>

        <div
          className={`flex space-x-1 transition-opacity ${
            hovering ? 'opacity-100' : 'opacity-0'
          }`}>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tab Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tempo">Tempo (BPM)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="tempo"
                      defaultValue={[block.tempo]}
                      min={60}
                      max={240}
                      step={1}
                      onValueChange={handleTempoChange}
                    />
                    <span className="w-12 text-center">{block.tempo}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0"
            onClick={() => setEditing(!editing)}>
            <Edit className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0"
            onClick={() => {
              const normalizedContent = tabUtils.normalizeTabLines(
                block.content
              );
              onUpdate(block.id, { content: normalizedContent });
              setCurrentContent(normalizedContent);
            }}
            title="Format tab">
            <AlignJustify className="h-3 w-3" />
          </Button>

          {/* {!isPlaying ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={() => onPlay(block.id)}>
              <Play className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={onStop}>
              <Square className="h-3 w-3" />
            </Button>
          )} */}
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {editing ? (
          <div className="grid gap-2">
            <Textarea
              ref={textareaRef}
              value={currentContent}
              onChange={handleContentChange}
              onClick={handleCursorPosition}
              onKeyUp={handleCursorPosition}
              className="font-mono text-sm h-56"
            />

            {/* Help info and shortcuts (only in edit mode) */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Tab techniques:</span>
              <TechniquesPopover />
              <span className="ml-4">Fretboard shortcuts:</span>
              <ShiftClickPopover />
            </div>

            {/* Fretboard Accordion (only in edit mode) */}
            <Accordion type="single" collapsible>
              <AccordionItem value="fretboard">
                <AccordionTrigger className="text-xs">
                  Fretboard
                </AccordionTrigger>
                <AccordionContent>
                  <Fretboard
                    onFretClick={handleFretClick}
                    tuning={tuning.split(' ')}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Hold SHIFT while clicking to write chords (keeps cursor in
                    the same column)
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelEditing()}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveContent}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <pre className="font-mono text-sm whitespace-pre overflow-x-auto p-2">
            {block.content}
          </pre>
        )}
      </CardContent>

      <CardFooter className="p-2 pt-0 flex justify-between">
        <div className="flex items-center space-x-2">
          {/* Footer content if needed */}
        </div>
      </CardFooter>

      {/* Control buttons that show on hover */}
      <div
        className={`absolute -left-10 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 transition-opacity ${
          hovering ? 'opacity-100' : 'opacity-0'
        }`}>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          }}
          title="Duplicate block">
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onMove(block.id, 'up');
          }}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onMove(block.id, 'down');
          }}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Add block buttons that show when block is active */}
      {isActive && (
        <div className="mt-2 flex space-x-2 border-t pt-2 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddBlock('text', block.id)}>
            <Text className="h-4 w-4 mr-2" />
            Add Text
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddBlock('tab', block.id)}>
            <Music className="h-4 w-4 mr-2" />
            Add Tab
          </Button>
        </div>
      )}
    </Card>
  );
};

export default React.memo(TabBlock);
