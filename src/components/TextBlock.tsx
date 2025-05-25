import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Music,
  Text,
  Edit,
  Copy,
  FileText,
  Code,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Import shadcn components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { TextBlockProps } from '../types';

// Text block component for notes and lyrics
const TextBlock: React.FC<TextBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onMove,
  isActive,
  setActive,
  onAddBlock,
  onDuplicate,
}) => {
  const [editing, setEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(block.content || '');
  const [hovering, setHovering] = useState(false);
  const [viewMode, setViewMode] = useState('preview');

  // Update local state when block content changes
  useEffect(() => {
    setCurrentContent(block.content || '');
  }, [block.content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentContent(e.target.value);
  };

  const saveContent = () => {
    onUpdate(block.id, { content: currentContent });
    setEditing(false);
  };

  const cancelEditing = () => {
    setCurrentContent(block.content || '');
    setEditing(false);
  };

  return (
    <Card
      className={`mb-4 border-2 relative ${isActive ? 'border-blue-400' : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => setActive(block.id)}>
      <CardHeader className="px-3 py-0.5 h-6 border-b flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Text className="h-3 w-3" />
        </div>

        {!editing && (
          <div
            className={`flex space-x-1 transition-opacity ${
              hovering ? 'opacity-100' : 'opacity-0'
            }`}>
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={() =>
                setViewMode(viewMode === 'preview' ? 'source' : 'preview')
              }>
              {viewMode === 'preview' ? (
                <Code className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={() => setEditing(true)}>
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3">
        {editing ? (
          <div className="grid gap-2">
            <Textarea
              value={currentContent}
              onChange={handleContentChange}
              className="min-h-32"
              placeholder="Enter markdown text here..."
            />
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveContent}>
                Save
              </Button>
            </div>
          </div>
        ) : viewMode === 'preview' ? (
          <div>
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-bold mb-2" {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                ul: ({ node, ...props }) => (
                  <ul className="mb-4 ml-6 list-disc" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="mb-4 ml-6 list-decimal" {...props} />
                ),
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-gray-300 pl-4 italic my-4"
                    {...props}
                  />
                ),
              }}>
              {block.content || ''}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {block.content}
          </pre>
        )}
      </CardContent>

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

export default React.memo(TextBlock);
