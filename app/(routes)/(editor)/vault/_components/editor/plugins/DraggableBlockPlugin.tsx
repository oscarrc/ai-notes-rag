'use client'

import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { RefObject, useRef } from 'react';
import { VscGripper } from 'react-icons/vsc';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

const DraggableBlockPlugin = ({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const targetLineRef = useRef<HTMLElement | null>(null);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef as RefObject<HTMLElement>}
      targetLineRef={targetLineRef as RefObject<HTMLElement>}
      menuComponent={
        <div
          className='absolute left-0 top-0 cursor-grab rounded-sm p-1 opacity-0 will-change-transform active:cursor-grabbing'
          ref={menuRef}
        >
          <VscGripper className='h-6 w-6' />
        </div>
      }
      targetLineComponent={
        <span
          className='pointer-events-none absolute left-0 top-0 h-1 bg-secondary will-change-transform'
          ref={targetLineRef}
        />
      }
      isOnMenu={isOnMenu}
    />
  );
};
export default DraggableBlockPlugin;
