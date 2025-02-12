import { createCommand, LexicalCommand } from 'lexical';
import { HeadingTagType } from '@lexical/rich-text';

export const INSERT_CODE_BLOCK_COMMAND: LexicalCommand<void> = createCommand();
export const INSERT_BLOCKQUOTE_COMMAND: LexicalCommand<void> = createCommand();
export const CLEAR_FORMAT_COMMAND: LexicalCommand<void> = createCommand();
export const FORMAT_PARAGRAPH_COMMAND: LexicalCommand<void> = createCommand();
export const FORMAT_HEADING_COMMAND: LexicalCommand<HeadingTagType> =
  createCommand();
