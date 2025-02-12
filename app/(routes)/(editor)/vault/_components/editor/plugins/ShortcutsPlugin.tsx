import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { HeadingTagType } from '@lexical/rich-text';
import {
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';

import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';

import { useEffect } from 'react';

import {
  isClearFormatting,
  isFormatBulletList,
  isFormatCheckList,
  isFormatCode,
  isFormatHeading,
  isFormatNumberedList,
  isFormatParagraph,
  isFormatQuote,
  isIndent,
  isInsertCodeBlock,
  isOutdent,
  isStrikeThrough,
  isSubscript,
  isSuperscript,
} from '../utils/Shortcuts';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  CLEAR_FORMAT_COMMAND,
  FORMAT_HEADING_COMMAND,
  FORMAT_PARAGRAPH_COMMAND,
  INSERT_BLOCKQUOTE_COMMAND,
  INSERT_CODE_BLOCK_COMMAND,
} from '../utils/Commands';

const ShortcutsPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const keyboardShortcutsHandler = (payload: KeyboardEvent) => {
      const event: KeyboardEvent = payload;

      if (isFormatParagraph(event)) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_PARAGRAPH_COMMAND, undefined);
      } else if (isFormatHeading(event)) {
        event.preventDefault();
        const { code } = event;
        const headingSize = `h${code[code.length - 1]}` as HeadingTagType;
        editor.dispatchCommand(FORMAT_HEADING_COMMAND, headingSize);
      } else if (isFormatBulletList(event)) {
        event.preventDefault();
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (isFormatNumberedList(event)) {
        event.preventDefault();
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else if (isFormatCheckList(event)) {
        event.preventDefault();
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      } else if (isFormatCode(event)) {
        event.preventDefault();
        editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
      } else if (isFormatQuote(event)) {
        event.preventDefault();
        editor.dispatchCommand(INSERT_BLOCKQUOTE_COMMAND, undefined);
      } else if (isStrikeThrough(event)) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      } else if (isIndent(event)) {
        event.preventDefault();
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
      } else if (isOutdent(event)) {
        event.preventDefault();
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
      } else if (isSubscript(event)) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
      } else if (isSuperscript(event)) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
      } else if (isInsertCodeBlock(event)) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
      } else if (isClearFormatting(event)) {
        event.preventDefault();
        editor.dispatchCommand(CLEAR_FORMAT_COMMAND, undefined);
      }

      return false;
    };

    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      keyboardShortcutsHandler,
      COMMAND_PRIORITY_NORMAL
    );
  }, [editor]);

  return null;
};
export default ShortcutsPlugin;
