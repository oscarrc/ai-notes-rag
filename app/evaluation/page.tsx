'use client';

import Embeddings from './_components/Embeddings';
import Generation from './_components/Generation';
import { useState } from 'react';

const Evaluation = () => {
  const [activeTab, setActiveTab] = useState('embeddings');

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold'>Evaluation Dashboard</h1>
        <p className='text-base-content/70'>
          Tests to evaluate the performance of the AI model and vector search
          capabilities.
        </p>
      </div>

      <div className='tabs-boxed tabs'>
        <button
          className={`tab ${activeTab === 'embeddings' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('embeddings')}
        >
          Semantic Search
        </button>
        <button
          className={`tab ${activeTab === 'generation' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('generation')}
        >
          Text Generation
        </button>
      </div>

      {activeTab === 'embeddings' && <Embeddings />}
      {activeTab === 'generation' && <Generation />}
    </div>
  );
};

export default Evaluation;
