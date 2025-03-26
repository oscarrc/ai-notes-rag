'use client';

import { EMBEDDING_MODELS, GENERATION_MODELS } from '../_providers/AiProvider';
import React, { ChangeEvent, useCallback, useRef, useState } from 'react';

import CircularProgress from './CircularProgress';
import { VscCheck } from 'react-icons/vsc';
import { VscClose } from 'react-icons/vsc';
import { useAi } from '../_hooks/useAi';
import { useToast } from '../_hooks/useToast';

const Settings = () => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const {
    embeddingModel,
    embeddingProgress,
    setEmbeddingModel,
    generationModel,
    generationProgress,
    setGenerationModel,
    getEmbeddings,
    saveEmbeddings,
  } = useAi();
  const { showToast, updateToast } = useToast();

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

  const handleReindex = useCallback(async () => {
    if (isReindexing) return;
    
    setIsReindexing(true);
    const toastId = showToast({
      message: 'Starting reindexing of notes...',
      type: 'info',
      duration: -1, // Don't auto-dismiss
      progress: 0,
    });

    try {
      // Fetch all file paths
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/embeddings`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch files for reindexing');
      }
      
      const { total, paths } = await response.json();
      
      if (total === 0) {
        updateToast(toastId, {
          message: 'No files found to reindex',
          type: 'warning',
          progress: 100,
        });
        setIsReindexing(false);
        return;
      }
      
      updateToast(toastId, {
        message: `Reindexing ${total} notes...`,
        progress: 5,
      });

      // Process each file
      let processed = 0;
      
      for (const filePath of paths) {
        try {
          // Get file content
          const fileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${filePath}`);
          if (!fileResponse.ok) continue;
          
          const file = await fileResponse.json();
          if (!file || !file.content) continue;
          
          // Generate embeddings
          const vector = await getEmbeddings(file.content);
          
          // Save embeddings
          await saveEmbeddings({
            name: file.name,
            path: file.path,
            content: file.content,
            vector,
          });
          
          // Update progress
          processed++;
          const progress = Math.round((processed / total) * 100);
          
          updateToast(toastId, {
            message: `Reindexed ${processed} of ${total} notes (${progress}%)`,
            progress,
          });
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
          continue; // Continue with next file even if this one fails
        }
      }
      
      updateToast(toastId, {
        message: `Successfully reindexed ${processed} notes`,
        type: 'success',
        progress: 100,
      });
    } catch (error) {
      console.error('Reindexing error:', error);
      updateToast(toastId, {
        message: `Reindexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        progress: 100,
      });
    } finally {
      setIsReindexing(false);
    }
  }, [isReindexing, getEmbeddings, saveEmbeddings, showToast, updateToast]);

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
            <div className='flex w-full max-w-lg justify-between items-center'>
              Reindex notes (May take a while){' '}
              <button 
                className={`btn btn-outline btn-primary btn-xs ${isReindexing ? 'btn-disabled' : ''}`}
                onClick={handleReindex}
                disabled={isReindexing}
              >
                {isReindexing ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    Reindexing...
                  </span>
                ) : (
                  'Reindex'
                )}
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
