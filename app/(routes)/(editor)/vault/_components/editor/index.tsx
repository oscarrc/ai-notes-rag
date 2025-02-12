'use client';

import { useState } from 'react';
import theme from './theme';
import { LexicalComposer } from '@lexical/react/LexicalComposer';

// Import all necessary plugins
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';

import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import AutoSavePlugin from './plugins/AutoSavePlugin';
import LinkPlugin from './plugins/LinkPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';

// Import all necessary nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { ParagraphNode } from 'lexical';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { AutoLinkNode } from '@lexical/link';
import { ImageNode } from './nodes/ImageNode';

// Markdown transformers
import { CUSTOM_TRANSFORMERS } from './utils/MarkdownTransformers';

interface EditorConfig {
  namespace: string;
  theme: Record<string, unknown>;
  onError: (error: Error) => void;
  nodes?: any[];
}

const editorConfig: EditorConfig = {
  namespace: 'MarkdownEditor',
  theme,
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
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<
    HTMLElement | undefined
  >();

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
      <CodeHighlightPlugin />
      <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
      <HistoryPlugin />
      <HorizontalRulePlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
      <RichTextPlugin
        contentEditable={
          <div className='prose flex w-full max-w-6xl flex-1 flex-col py-4'>
            <div className='relative h-full px-10' ref={onRef}>
              <ContentEditable className='editor editor-input focus-visible:outline-none' />
            </div>
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ShortcutsPlugin />
      <TabIndentationPlugin />
      <ToolbarPlugin />
    </LexicalComposer>
  );
};

export default MarkdownEditor;
