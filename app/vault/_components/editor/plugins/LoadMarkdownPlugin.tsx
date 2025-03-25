import { $convertFromMarkdownString, Transformer } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect, useState } from 'react';

const LoadMarkdownPlugin = ({
  content,
  transformers,
}: {
  content: string;
  transformers: Transformer[];
}) => {
  const [editor] = useLexicalComposerContext();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!content || !content.length) return;
    if (loaded) return;

    editor.update(() => {
      $convertFromMarkdownString(
        content,
        transformers,
        $getRoot(),
        false,
        true
      );
      setLoaded(true);
    });
  }, [content]);

  return null;
};

export default LoadMarkdownPlugin;
