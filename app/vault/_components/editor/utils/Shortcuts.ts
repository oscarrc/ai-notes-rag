import { ctrlOrMeta, IS_APPLE } from '@/app/_utils/shortcuts';

export const SHORTCUTS = Object.freeze({
  // (Ctrl|Cmd) + (Alt|Option) + <key> shortcuts
  NORMAL: IS_APPLE ? 'Cmd+Opt+0' : 'Ctrl+Alt+0',
  HEADING1: IS_APPLE ? 'Cmd+Opt+1' : 'Ctrl+Alt+1',
  HEADING2: IS_APPLE ? 'Cmd+Opt+2' : 'Ctrl+Alt+2',
  HEADING3: IS_APPLE ? 'Cmd+Opt+3' : 'Ctrl+Alt+3',
  BULLET_LIST: IS_APPLE ? 'Cmd+Opt+4' : 'Ctrl+Alt+4',
  NUMBERED_LIST: IS_APPLE ? 'Cmd+Opt+5' : 'Ctrl+Alt+5',
  CHECK_LIST: IS_APPLE ? 'Cmd+Opt+6' : 'Ctrl+Alt+6',
  CODE_BLOCK: IS_APPLE ? 'Cmd+Opt+C' : 'Ctrl+Alt+C',
  QUOTE: IS_APPLE ? 'Cmd+Opt+Q' : 'Ctrl+Alt+Q',

  // (Ctrl|Cmd) + Shift + <key> shortcuts
  INSERT_CODE_BLOCK: IS_APPLE ? 'Cmd+Shift+C' : 'Ctrl+Shift+C',
  STRIKETHROUGH: IS_APPLE ? 'Cmd+Shift+S' : 'Ctrl+Shift+S',

  // (Ctrl|Cmd) + <key> shortcuts
  SUBSCRIPT: IS_APPLE ? 'Cmd+,' : 'Ctrl+,',
  SUPERSCRIPT: IS_APPLE ? 'Cmd+.' : 'Ctrl+.',
  INDENT: IS_APPLE ? 'Cmd+]' : 'Ctrl+]',
  OUTDENT: IS_APPLE ? 'Cmd+[' : 'Ctrl+[',
  CLEAR_FORMATTING: IS_APPLE ? 'Cmd+\\' : 'Ctrl+\\',
  REDO: IS_APPLE ? 'Cmd+Shift+Z' : 'Ctrl+Y',
  UNDO: IS_APPLE ? 'Cmd+Z' : 'Ctrl+Z',
  BOLD: IS_APPLE ? 'Cmd+B' : 'Ctrl+B',
  ITALIC: IS_APPLE ? 'Cmd+I' : 'Ctrl+I',
  UNDERLINE: IS_APPLE ? 'Cmd+U' : 'Ctrl+U',
  INSERT_LINK: IS_APPLE ? 'Cmd+K' : 'Ctrl+K',
});

export function isFormatParagraph(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;

  return (
    (code === 'Numpad0' || code === 'Digit0') &&
    !shiftKey &&
    altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isFormatHeading(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  const keyNumber = code[code.length - 1];

  return (
    ['1', '2', '3'].includes(keyNumber) &&
    !shiftKey &&
    altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isFormatBulletList(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    (code === 'Numpad4' || code === 'Digit4') &&
    !shiftKey &&
    altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isFormatNumberedList(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    (code === 'Numpad5' || code === 'Digit5') &&
    !shiftKey &&
    altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isFormatCheckList(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    (code === 'Numpad6' || code === 'Digit6') &&
    !shiftKey &&
    altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isFormatCode(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return code === 'KeyC' && !shiftKey && altKey && ctrlOrMeta(metaKey, ctrlKey);
}

export function isFormatQuote(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return code === 'KeyQ' && !shiftKey && altKey && ctrlOrMeta(metaKey, ctrlKey);
}

export function isStrikeThrough(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return code === 'KeyS' && shiftKey && !altKey && ctrlOrMeta(metaKey, ctrlKey);
}

export function isIndent(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    code === 'BracketRight' &&
    !shiftKey &&
    !altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isOutdent(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    code === 'BracketLeft' &&
    !shiftKey &&
    !altKey &&
    ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isSubscript(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    code === 'Comma' && !shiftKey && !altKey && ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isSuperscript(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    code === 'Period' && !shiftKey && !altKey && ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isInsertCodeBlock(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return code === 'KeyC' && shiftKey && !altKey && ctrlOrMeta(metaKey, ctrlKey);
}

export function isClearFormatting(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return (
    code === 'Backslash' && !shiftKey && !altKey && ctrlOrMeta(metaKey, ctrlKey)
  );
}

export function isInsertLink(event: KeyboardEvent): boolean {
  const { code, shiftKey, altKey, metaKey, ctrlKey } = event;
  return code === 'KeyK' && !shiftKey && altKey && ctrlOrMeta(metaKey, ctrlKey);
}
