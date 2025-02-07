'use client';

import { useCallback, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

// Import all necessary nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TableNode } from '@lexical/table';
import { ParagraphNode } from 'lexical'; // Default node for paragraphs

interface EditorConfig {
  namespace: string;
  theme: Record<string, unknown>;
  onError: (error: Error) => void;
  nodes?: any[]; // Add nodes property to EditorConfig interface
}

const editorConfig: EditorConfig = {
  namespace: 'MarkdownEditor',
  theme: {},
  onError: (error: Error) => {
    console.error('Lexical Error:', error);
  },
  nodes: [
    HeadingNode, // For headings
    QuoteNode, // For blockquotes
    ListNode, // For lists
    ListItemNode, // For list items
    CodeNode, // For inline code
    CodeHighlightNode, // For code blocks with syntax highlighting
    LinkNode, // For links
    ParagraphNode, // For paragraphs (default node)
    TableNode,
  ],
};

const MarkdownEditor = () => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const saveMarkdown = async (markdown: string) => {
    try {
      await fetch('/api/save-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
    } catch (error) {
      console.error('Error saving markdown:', error);
    }
  };

  const onChange = useCallback((editorState: any) => {
    // if (debounceTimeout.current) {
    //   clearTimeout(debounceTimeout.current);
    // }
    // debounceTimeout.current = setTimeout(() => {
    //   editorState.read(() => {
    //     const markdown = $convertToMarkdownString(TRANSFORMERS);
    //     saveMarkdown(markdown);
    //   });
    // }, 500);
  }, []);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <RichTextPlugin
        contentEditable={<ContentEditable className='editor-input focus-visible:outline-none' />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={onChange} />
    </LexicalComposer>
  );
};

export default MarkdownEditor;
