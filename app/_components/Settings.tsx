'use client';

import { EMBEDDING_MODELS, GENERATION_MODELS } from '../_providers/AiProvider';
import React, { ChangeEvent, useRef } from 'react';

import CircularProgress from './CircularProgress';
import { VscCheck } from 'react-icons/vsc';
import { VscClose } from 'react-icons/vsc';
import { useAi } from '../_hooks/useAi';

const Settings = () => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const {
    embeddingModel,
    embeddingProgress,
    setEmbeddingModel,
    generationModel,
    generationProgress,
    setGenerationModel,
  } = useAi();

  const handleEmbeddingsModel = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!EMBEDDING_MODELS.includes(value)) return;
    else setEmbeddingModel(value);
  };

  const handleInferenceModel = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!GENERATION_MODELS.includes(value)) return;
    else setGenerationModel(value);
  };

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
              <div className='flex flex-row items-center gap-4'>
                <select
                  value={generationModel}
                  onChange={handleInferenceModel}
                  className='select select-bordered select-sm flex-1'
                >
                  {GENERATION_MODELS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <div
                  className={`swap swap-rotate h-8 w-8 place-items-center items-center justify-center ${generationProgress === 100 ? 'swap-active' : ''}`}
                >
                  <VscCheck className='swap-on h-6 w-6 text-primary' />
                  <CircularProgress
                    value={generationProgress}
                    className='swap-off'
                  />
                </div>
              </div>
            </label>
            <label className='form-control w-full max-w-lg'>
              <div className='label'>
                <span className='label-text'>Select embeddings model</span>
              </div>
              <div className='flex flex-row gap-4'>
                <select
                  value={embeddingModel}
                  onChange={handleEmbeddingsModel}
                  className='select select-bordered select-sm flex-1'
                >
                  {EMBEDDING_MODELS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <div
                  className={`swap swap-rotate h-8 w-8 place-items-center items-center justify-center ${embeddingProgress === 100 ? 'swap-active' : ''}`}
                >
                  <VscCheck className='swap-on h-6 w-6 text-primary' />
                  <CircularProgress
                    value={embeddingProgress}
                    className='swap-off'
                  />
                </div>
              </div>
            </label>
            <div className='flex w-full max-w-lg justify-between'>
              Reindex notes (May take a while){' '}
              <button className='btn btn-outline btn-primary btn-xs'>
                Reindex
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Settings;
