'use client';

import React, { useEffect, useRef, useState } from 'react';

import { BsSearch } from 'react-icons/bs';
import { useAi } from '../_hooks/useAi';
import useDebounce from '../_hooks/useDebounce';
import useNavigationStore from '../_store/navigationStore';
import { useQuery } from '@tanstack/react-query';

const skeleton = [...Array(4)];

const Search = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [embeddings, setEmbeddings] = useState(null);

  const listRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const { addTab, setTab } = useNavigationStore();
  const { fetchEmbeddings, getEmbeddings } = useAi();

  const debouncedQuery = useDebounce(query, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['embeddings', debouncedQuery, embeddings],
    queryFn: () => fetchEmbeddings(embeddings),
    enabled: !!embeddings,
  });

  const handleSelection = (
    e: React.MouseEvent | React.KeyboardEvent,
    index: number,
    record: EmbeddingRecord
  ) => {
    const hasModifier = e?.ctrlKey || e?.metaKey;

    setSelected(index);

    hasModifier
      ? addTab({ name: record.name, path: record.path })
      : setTab({ name: record.name, path: record.path });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    const code = e.code;
    switch (code) {
      case 'ArrowUp':
        setSelected((s) => (s > 0 ? s - 1 : s));
        break;
      case 'ArrowDown':
        setSelected((s) => (s < data?.length - 1 ? s + 1 : s));
        break;
      case 'Enter':
        e.preventDefault();
        dialogRef.current?.close();
        handleSelection(e, selected, data?.[selected]);
        break;
      default:
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (listRefs.current[selected]) {
      listRefs.current[selected]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selected]);

  useEffect(() => {
    if (!debouncedQuery) return;

    const calculate = async () => {
      const e = await getEmbeddings(debouncedQuery);
      setEmbeddings(e);
    };
    calculate();
  }, [debouncedQuery, getEmbeddings]);

  return (
    <dialog ref={dialogRef} id='search' className='modal' onKeyDown={handleKey}>
      <div className='place-self-start-center modal-box mt-[15dvh] flex grid grid-rows-[1fr] flex-col gap-2 overflow-hidden rounded-lg p-0'>
        <div className='flex items-center border-b border-base-content/20 px-4'>
          <BsSearch className='h-4 w-4' />
          <input
            type='text'
            placeholder='Type to search'
            className='input w-full max-w-lg rounded-b-none border-none focus:outline-none'
            onChange={handleChange}
            value={query}
          />
        </div>
        <ul className='menu h-40 w-full flex-nowrap gap-1 overflow-y-auto'>
          {isLoading
            ? skeleton.map((_, index) => (
                <li key={index} className='skeleton my-0 h-8 rounded-md'></li>
              ))
            : data?.map((item: EmbeddingRecord, index: number) => (
                <li
                  key={index}
                  ref={(el) => {
                    listRefs.current[index] = el;
                  }}
                >
                  <button
                    className={`${selected === index ? 'bg-base-300' : ''}`}
                    onClick={(e) => handleSelection(e, index, item)}
                  >
                    {item.name}
                  </button>
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
