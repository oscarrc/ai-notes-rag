import { createCommand, LexicalCommand } from 'lexical';

export const INSERT_CODE_BLOCK_COMMAND: LexicalCommand<void> = createCommand();
export const INSERT_BLOCKQUOTE_COMMAND: LexicalCommand<void> = createCommand();
