'use client';

import { useCallback, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'

// Import all necessary nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TableNode } from '@lexical/table';
import { ParagraphNode } from 'lexical';
import useNavigationStore from '@/app/_store/navigationStore';
import DraggableBlockPlugin from './plugins/DragableBlockPlugin';

interface EditorConfig {
  namespace: string;
  theme: Record<string, unknown>;
  onError: (error: Error) => void;
  nodes?: any[];
}

const editorConfig: EditorConfig = {
  namespace: 'MarkdownEditor',
  theme: {},
  onError: (error: Error) => {
    console.error('Lexical Error:', error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    ParagraphNode,
    TableNode,
  ],
};

const MarkdownEditor = () => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLElement | undefined>();
  const { tabs, activeTab } = useNavigationStore();

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const saveMarkdown = async (markdown: string) => {
    try {
      await fetch(`/api/files/${tabs[activeTab].path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tabs[activeTab], content: markdown }),
      });
    } catch (error) {
      console.error('Error saving markdown:', error);
    }
  };

  const onChange = useCallback((editorState: any) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        saveMarkdown(markdown);
      });
    }, 500);
  }, []);

  return (      
    <LexicalComposer initialConfig={editorConfig}>
      <div className='prose flex w-full max-w-6xl flex-1 flex-col py-4'>
        <div className='h-full'>  
          <RichTextPlugin
            contentEditable={
              <div className="h-full relative px-8" ref={onRef}>
                <ContentEditable className="editor editor-input focus-visible:outline-none" />
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
          <OnChangePlugin onChange={onChange} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default MarkdownEditor;
