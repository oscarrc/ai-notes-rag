export const IS_APPLE = navigator && /Mac|iPod|iPhone|iPad/.test(navigator?.platform);

export function ctrlOrMeta(metaKey: boolean, ctrlKey: boolean): boolean {
  return IS_APPLE ? metaKey : ctrlKey;
}

export function isShortcut(e: KeyboardEvent): boolean {
  const { composed, metaKey, ctrlKey } = e;
  return composed && ctrlOrMeta(metaKey, ctrlKey);
}
