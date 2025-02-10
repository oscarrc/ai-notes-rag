import { VscMarkdown } from 'react-icons/vsc';

import { $createCodeNode, $isCodeNode } from '@lexical/code';

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { $createTextNode, $getRoot } from 'lexical';
import { useCallback } from 'react';

import { CUSTOM_TRANSFORMERS } from '../utils/MarkdownTransformers';

const ActionsPlugin = () => {
  const [editor] = useLexicalComposerContext();

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          CUSTOM_TRANSFORMERS,
          undefined, // node
          true
        );
      } else {
        const markdown = $convertToMarkdownString(
          CUSTOM_TRANSFORMERS,
          undefined, // node
          true
        );
        const codeNode = $createCodeNode('markdown');
        codeNode.append($createTextNode(markdown));
        root.clear().append(codeNode);
        if (markdown.length === 0) {
          codeNode.select();
        }
      }
    });
  }, [editor]);

  return (
    <div className='absolute bottom-8 right-8'>
      <button
        className='btn btn-square btn-outline btn-sm'
        onClick={handleMarkdownToggle}
        title='Convert From Markdown'
        aria-label='Convert from markdown'
      >
        <VscMarkdown className='h-4 w-4' />
      </button>
    </div>
  );
};

export default ActionsPlugin;
