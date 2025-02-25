'use client';

import React, { ChangeEvent, useRef } from 'react';
import { VscClose } from 'react-icons/vsc';
import { EmbeddingsModels } from '../_providers/EmbeddingsProvider';
import { useEmbeddings } from '../_hooks/useEmbeddings';
import { InferenceModels } from '../_providers/InferenceProvider';
import { useInference } from '../_hooks/useInference';
import CircularProgress from './CircularProgress';
import { VscCheck } from "react-icons/vsc";

const Settings = () => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { model: embeddingsModel, setModel: setEmbbedingsModel, progress: embeddingsProgress, ready: embeddingsReady  } = useEmbeddings();
  const { model: inferenceModel, setModel: setInferenceModel, progress: inferenceProgress, ready: inferenceReady } = useInference();

  const handleEmbeddingsModel = (e:ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if(!EmbeddingsModels.includes(value)) return;
    else setEmbbedingsModel(value);
  }

  const handleInferenceModel = (e:ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if(!InferenceModels.includes(value)) return;
    else setInferenceModel(value);
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
              <div className='flex flex-row gap-4 items-center'>
                <select value={inferenceModel} onChange={handleInferenceModel} className='select select-bordered select-sm flex-1'>
                  {
                    InferenceModels.map(m => <option key={m}>{m}</option>)
                  }                
                </select>                
                <div className={`h-8 w-8 place-items-center items-center justify-center swap swap-rotate ${inferenceReady ? 'swap-active' : ''}`}>
                  <VscCheck className="h-6 w-6 text-primary swap-on" />
                  <CircularProgress value={inferenceProgress} className='swap-off'/> 
                </div> 
              </div>
            </label>
            <label className='form-control w-full max-w-lg'>
              <div className='label'>
                <span className='label-text'>Select embeddings model</span>
              </div>              
              <div className='flex flex-row gap-4'>
                <select value={embeddingsModel} onChange={handleEmbeddingsModel} className='select select-bordered select-sm flex-1'>
                  {
                    EmbeddingsModels.map(m => <option key={m}>{m}</option>)
                  }                
                </select>
                <div className={`h-8 w-8 place-items-center items-center justify-center swap swap-rotate ${embeddingsReady ? 'swap-active' : ''}`}>
                  <VscCheck className="h-6 w-6 text-primary swap-on" />
                  <CircularProgress value={embeddingsProgress} className='swap-off'/> 
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
