'use client';

import { ChangeEvent, useRef } from 'react';
import { VscClose } from 'react-icons/vsc';
import { EmbeddingsModels } from '../_providers/EmbeddingsProvider';
import { useEmbeddings } from '../_hooks/useEmbeddings';

const Settings = () => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { model, setModel } = useEmbeddings();

  const handleEmbeddingsModel = (e:ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if(!EmbeddingsModels.includes(value)) return;
    else setModel(value);
  }

  return (
    <dialog id='settings' className='modal' ref={dialogRef}>
      <div className='modal-box'>
        <button
          className='btn btn-circle btn-ghost btn-sm absolute right-2 top-2'
          onClick={() => dialogRef?.current?.close()}
        >
          <VscClose className='h-4 w-4' />
        </button>

        <div className='flex flex-col gap-4'>
          <h3 className='text-lg font-bold'>Settings</h3>
          <div className='flex flex-1 flex-col gap-8'>
            <label className='form-control w-full max-w-lg'>
              <div className='label'>
                <span className='label-text'>Select inference model</span>
              </div>
              <select className='select select-bordered select-sm'>
                <option disabled>Pick one</option>
              </select>
            </label>
            <label className='form-control w-full max-w-lg'>
              <div className='label'>
                <span className='label-text'>Select embeddings model</span>
              </div>
              <select value={model} onChange={handleEmbeddingsModel} className='select select-bordered select-sm'>
                {
                  EmbeddingsModels.map(m => <option key={m}>{m}</option>)
                }
                
              </select>
            </label>
            <div className='flex w-full max-w-lg justify-between'>
              Reindex notes (May take a while){' '}
              <button className='btn btn-outline btn-primary btn-xs'>
                Reindex
              </button>
            </div>
          </div>
        </div>
        <div className='modal-actions mt-8 flex justify-end gap-2'>
          <button
            className='btn btn-sm'
            onClick={() => dialogRef?.current?.close()}
          >
            Cancel
          </button>
          <button className='btn btn-primary btn-sm'>Save</button>
        </div>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Settings;
