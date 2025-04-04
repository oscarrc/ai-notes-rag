import { EditorState, $getRoot } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertToMarkdownString, Transformer } from '@lexical/markdown';
import { useCallback, useRef } from 'react';

interface AutoSavePluginProps {
  transformers: Transformer[];
  onSave?: (...a: any) => void;
}

const AutoSavePlugin = ({ onSave, transformers }: AutoSavePluginProps) => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSave = async (markdown: string, text: string) => {
    onSave && onSave(markdown, text);
  };

  const onChange = useCallback((editorState: EditorState) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(transformers).replace(
          /\n\n\n \n\n\n/gm,
          '\n\n \n\n'
        );

        const text = $getRoot().getTextContent();
        handleSave(markdown, text);
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
