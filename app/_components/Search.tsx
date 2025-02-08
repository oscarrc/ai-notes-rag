import React, { RefObject, useState } from 'react';
import { BsSearch } from 'react-icons/bs';

interface SearchProps {
  ref: RefObject<HTMLDialogElement | null>;
}

const Search = ({ ref }: SearchProps) => {
  const [selected, setSelected] = useState(0);
  const items = ['Item 1', 'Item 2', 'Item 3'];

  const handleKey = (e: React.KeyboardEvent) => {
    const code = e.code;
    switch (code) {
      case 'ArrowUp':
        setSelected((s) => (s > 0 ? s - 1 : s));
        break;
      case 'ArrowDown':
        setSelected((s) => (s < items.length - 1 ? s + 1 : s));
        break;
      case 'Enter':
        break;
      default:
        break;
    }
  };

  return (
    <dialog id='search' className='modal' ref={ref} onKeyDown={handleKey}>
      <div className='place-self-start-center modal-box mt-[15dvh] flex grid max-h-[75dvh] grid-rows-[1fr] flex-col gap-2 overflow-hidden rounded-lg p-0'>
        <div className='flex items-center border-b border-base-content/20 px-4'>
          <BsSearch className='h-4 w-4' />
          <input
            type='text'
            placeholder='Type to search'
            className='input w-full max-w-lg rounded-b-none border-none focus:outline-none'
          />
        </div>
        <ul className='menu w-full flex-nowrap overflow-y-auto'>
          {items.map((item, index) => (
            <li
              className={`${selected === index ? 'bg-base-200' : ''}`}
              key={index}
            >
              <a>{item}</a>
            </li>
          ))}
        </ul>
        <div className='modal-actions flex justify-between gap-4 border-t border-base-content/20 px-4 py-2 text-sm text-base-content/50'>
          <div>
            <kbd className='kbd kbd-xs'>↑</kbd> /{' '}
            <kbd className='kbd kbd-xs'>↓</kbd> select
          </div>
          <div>
            <kbd className='kbd kbd-xs'>↲</kbd> open
          </div>
          <div>
            <kbd className='kbd kbd-xs'>Esc</kbd> close
          </div>
        </div>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Search;
