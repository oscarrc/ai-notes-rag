'use client';

import { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

// Import all necessary nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { ParagraphNode } from 'lexical';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { AutoLinkNode } from '@lexical/link';

import useNavigationStore from '@/app/_store/navigationStore';

import { CUSTOM_TRANSFORMERS } from './utils/MarkdownTransformers';
import DraggableBlockPlugin from './plugins/DragableBlockPlugin';
import AutoSavePlugin from './plugins/AutoSavePlugin';
import LinkPlugin from './plugins/LinkPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';

import { ImageNode } from './nodes/ImageNode';

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
    AutoLinkNode,
    CodeHighlightNode,
    CodeNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    LinkNode,
    ListItemNode,
    ListNode,
    ParagraphNode,
    QuoteNode,
    TableCellNode,
    TableNode,
    TableRowNode,
  ],
};

const MarkdownEditor = () => {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLElement | undefined>();
  const { tabs, activeTab } = useNavigationStore();

  const onRef = (elem: HTMLDivElement) => {
    if (elem !== null) {
      setFloatingAnchorElem(elem);
    }
  };

  return (      
    <LexicalComposer initialConfig={editorConfig}>
      <AutoFocusPlugin />
      <AutoLinkPlugin />
      <AutoSavePlugin />
      <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
      <HistoryPlugin />
      <HorizontalRulePlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
      <RichTextPlugin
        contentEditable={
          <div className='prose flex w-full max-w-6xl flex-1 flex-col py-4'>
            <div className="h-full relative px-10" ref={onRef}>
              <ContentEditable className="editor editor-input focus-visible:outline-none" />
            </div>
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <TabIndentationPlugin />
    </LexicalComposer>
  );
};

export default MarkdownEditor;
