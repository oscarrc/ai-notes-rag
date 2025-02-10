import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { HeadingTagType } from '@lexical/rich-text';
import {
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

import { useToolbarState } from '../context/ToolbarContext';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from '../utils/Format';

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

const ShortcutsPlugin = () => {
  const { toolbarState } = useToolbarState();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const keyboardShortcutsHandler = (payload: KeyboardEvent) => {
      const event: KeyboardEvent = payload;

      if (isFormatParagraph(event)) {
        event.preventDefault();
        formatParagraph(editor);
      } else if (isFormatHeading(event)) {
        event.preventDefault();
        const { code } = event;
        const headingSize = `h${code[code.length - 1]}` as HeadingTagType;
        formatHeading(editor, toolbarState.blockType, headingSize);
      } else if (isFormatBulletList(event)) {
        event.preventDefault();
        formatBulletList(editor, toolbarState.blockType);
      } else if (isFormatNumberedList(event)) {
        event.preventDefault();
        formatNumberedList(editor, toolbarState.blockType);
      } else if (isFormatCheckList(event)) {
        event.preventDefault();
        formatCheckList(editor, toolbarState.blockType);
      } else if (isFormatCode(event)) {
        event.preventDefault();
        formatCode(editor, toolbarState.blockType);
      } else if (isFormatQuote(event)) {
        event.preventDefault();
        formatQuote(editor, toolbarState.blockType);
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
        clearFormatting(editor);
      }

      return false;
    };

    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      keyboardShortcutsHandler,
      COMMAND_PRIORITY_NORMAL
    );
  }, [editor, toolbarState.isLink, toolbarState.blockType]);

  return null;
};
export default ShortcutsPlugin;
