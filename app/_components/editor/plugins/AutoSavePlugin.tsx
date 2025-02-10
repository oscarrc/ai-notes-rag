import { EditorState } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertToMarkdownString } from '@lexical/markdown';
import { CUSTOM_TRANSFORMERS } from '../utils/MarkdownTransformers';
import { useCallback, useRef } from 'react';

const AutoSavePlugin = () => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const saveMarkdown = async (markdown: string) => {};

  const onChange = useCallback((editorState: EditorState) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS).replace(
          /\n\n\n \n\n\n/gm,
          '\n\n \n\n'
        );
        saveMarkdown(markdown);
      });
    }, 500);
  }, []);

  return (
    <OnChangePlugin
      onChange={onChange}
      ignoreSelectionChange
      ignoreHistoryMergeTagChange
    />
  );
};

export default AutoSavePlugin;
