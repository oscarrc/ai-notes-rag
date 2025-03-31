'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import React, { useEffect, useRef, useState } from 'react';
import { VscDebugStart, VscInfo } from 'react-icons/vsc';

import { testQueries } from './_utils/queries';
import { useAi } from '../_hooks/useAi';
import { useToast } from '../_hooks/useToast';

const Evaluation = () => {
  const {
    getEmbeddings,
    fetchEmbeddings,
    generateAnswer,
    performance,
    status,
  } = useAi();

  const { showToast } = useToast();

  // State for test results
  const [embeddingsResults, setEmbeddingsResults] = useState<any[]>([]);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [runEmbeddingsTest, setRunEmbeddingsTest] = useState(false);
  const [embeddingStats, setEmbeddingStats] = useState({
    avgTime: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  });

  const [generationResults, setGenerationResults] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [runGenerationTests, setRunGenerationTests] = useState(false);
  const [generationStats, setGenerationStats] = useState({
    avgTime: 0,
    avgTps: 0,
    avgTokens: 0,
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('embeddings');

  // Run embeddings test
  const testEmbeddings = async () => {
    setLoading(true);
    try {
      const start = Date.now();
      const query = await getEmbeddings(testQueries[embeddingProgress].query);
      const docs = await fetchEmbeddings(query);
      const end = Date.now();

      const receivedDocIds = docs.map((r: EmbeddingRecord) => r.path);
      const expectedDocIds =
        testQueries[embeddingProgress].relevantDocIds || [];

      // Calculate precision and recall
      const truePositives = receivedDocIds.filter((id: string) =>
        expectedDocIds.includes(id)
      ).length;
      const precision =
        expectedDocIds.length > 0 ? truePositives / receivedDocIds.length : 0;
      const recall =
        expectedDocIds.length > 0 ? truePositives / expectedDocIds.length : 0;
      const f1Score =
        precision + recall > 0
          ? (2 * (precision * recall)) / (precision + recall)
          : 0;

      const result = {
        id: embeddingProgress,
        query: testQueries[embeddingProgress].query,
        time: end - start,
        expected: expectedDocIds,
        received: receivedDocIds,
        precision,
        recall,
        f1Score,
      };

      setTimeout(() => {
        setLoading(false);
        setEmbeddingsResults((prev) => [...prev, result]);
        setEmbeddingProgress((prev) => prev + 1);
      }, 500);
    } catch (error) {
      setLoading(false);
      showToast({
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        duration: 3000,
      });
    }
  };

  // Run generation test
  const testGeneration = async () => {
    setLoading(true);
    try {
      const start = Date.now();
      await generateAnswer(testQueries[generationProgress].query);
      const end = Date.now();

      const result = {
        id: generationProgress,
        query: testQueries[generationProgress].query,
        numTokens: performance.numTokens,
        tps: performance.tps,
        generationTime: performance.totalTime,
        totalTime: end - start,
      };

      setLoading(false);
      setGenerationResults((prev) => [...prev, result]);
      setGenerationProgress((prev) => prev + 1);
    } catch (error) {
      setLoading(false);
      showToast({
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        duration: 3000,
      });
    }
  };

  // Calculate statistics when results change
  useEffect(() => {
    if (embeddingsResults.length === 0) return;

    const avgTime =
      embeddingsResults.reduce((sum, r) => sum + r.time, 0) /
      embeddingsResults.length;
    const precision =
      embeddingsResults.reduce((sum, r) => sum + r.precision, 0) /
      embeddingsResults.length;
    const recall =
      embeddingsResults.reduce((sum, r) => sum + r.recall, 0) /
      embeddingsResults.length;
    const f1Score =
      embeddingsResults.reduce((sum, r) => sum + r.f1Score, 0) /
      embeddingsResults.length;

    setEmbeddingStats({ avgTime, precision, recall, f1Score });
  }, [embeddingsResults]);

  useEffect(() => {
    if (generationResults.length === 0) return;

    const avgTime =
      generationResults.reduce((sum, r) => sum + r.totalTime, 0) /
      generationResults.length;
    const avgTps =
      generationResults.reduce((sum, r) => sum + r.tps, 0) /
      generationResults.length;
    const avgTokens =
      generationResults.reduce((sum, r) => sum + r.numTokens, 0) /
      generationResults.length;

    setGenerationStats({ avgTime, avgTps, avgTokens });
  }, [generationResults]);

  // Run tests automatically when flags are set
  useEffect(() => {
    if (loading) return;
    if (!runEmbeddingsTest) return;
    if (embeddingProgress >= testQueries.length) {
      setRunEmbeddingsTest(false);
      setEmbeddingProgress(0);
      setLoading(false);
      showToast({
        message: 'Embedding tests completed!',
        type: 'success',
        duration: 3000,
      });
      return;
    }
    console.log({ runEmbeddingsTest });
    testEmbeddings();
  }, [runEmbeddingsTest, loading, embeddingProgress]);

  useEffect(() => {
    if (loading) return;
    if (!runGenerationTests) return;
    if (status !== 'idle' && status !== 'ready') return;
    if (generationProgress >= testQueries.length) {
      setRunGenerationTests(false);
      setGenerationProgress(0);
      setLoading(false);
      showToast({
        message: 'Generation tests completed!',
        type: 'success',
        duration: 3000,
      });
      return;
    }

    testGeneration();
  }, [runGenerationTests, loading, generationProgress, status]);

  // Reset test handlers
  const handleRunEmbeddingTests = () => {
    setEmbeddingsResults([]);
    setEmbeddingProgress(0);
    setRunEmbeddingsTest(true);
  };

  const handleRunGenerationTests = () => {
    setGenerationResults([]);
    setGenerationProgress(0);
    setRunGenerationTests(true);
  };

  // Format precision/recall for display
  const formatPercent = (value: number): string =>
    `${(value * 100).toFixed(1)}%`;

  // Format time for display
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold'>Evaluation Dashboard</h1>
        <p className='text-base-content/70'>
          Run tests to evaluate the performance of the AI model and vector
          search capabilities.
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

      {activeTab === 'embeddings' && (
        <div className='flex flex-col gap-6'>
          <div className='flex flex-wrap gap-4'>
            <div className='stats shadow'>
              <div className='stat'>
                <div className='stat-title'>Average Response Time</div>
                <div className='stat-value'>
                  {formatTime(embeddingStats.avgTime)}
                </div>
                <div className='stat-desc'>For vector search operations</div>
              </div>
            </div>

            <div className='stats shadow'>
              <div className='stat'>
                <div className='stat-title'>Precision</div>
                <div className='stat-value'>
                  {formatPercent(embeddingStats.precision)}
                </div>
                <div className='stat-desc'>Relevant/Retrieved</div>
              </div>
              <div className='stat'>
                <div className='stat-title'>Recall</div>
                <div className='stat-value'>
                  {formatPercent(embeddingStats.recall)}
                </div>
                <div className='stat-desc'>Found/Total Relevant</div>
              </div>
              <div className='stat'>
                <div className='stat-title'>F1 Score</div>
                <div className='stat-value'>
                  {formatPercent(embeddingStats.f1Score)}
                </div>
                <div className='stat-desc'>Balanced Accuracy</div>
              </div>
            </div>
          </div>

          <div className='card bg-base-200 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title'>Semantic Search Performance</h2>
              <div className='h-80 w-full'>
                {embeddingsResults.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={embeddingsResults}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='id' />
                      <YAxis
                        yAxisId='left'
                        orientation='left'
                        stroke='#8884d8'
                      />
                      <YAxis
                        yAxisId='right'
                        orientation='right'
                        stroke='#82ca9d'
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'time')
                            return formatTime(value as number);
                          if (
                            ['precision', 'recall', 'f1Score'].includes(
                              name as string
                            )
                          )
                            return formatPercent(value as number);
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId='left'
                        dataKey='time'
                        name='Response Time (ms)'
                        fill='#8884d8'
                      />
                      <Bar
                        yAxisId='right'
                        dataKey='precision'
                        name='Precision'
                        fill='#82ca9d'
                      />
                      <Bar
                        yAxisId='right'
                        dataKey='recall'
                        name='Recall'
                        fill='#ffc658'
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <div className='flex flex-col items-center gap-4 text-base-content/50'>
                      <VscInfo className='h-12 w-12' />
                      <p>Run tests to see results</p>
                    </div>
                  </div>
                )}
              </div>
              <div className='card-actions justify-end'>
                <button
                  className='btn btn-primary'
                  onClick={handleRunEmbeddingTests}
                  disabled={runEmbeddingsTest || loading}
                >
                  {loading && runEmbeddingsTest ? (
                    <>
                      <span className='loading loading-spinner'></span>
                      Testing {embeddingProgress + 1}/{testQueries.length}
                    </>
                  ) : (
                    <>
                      <VscDebugStart className='h-5 w-5' />
                      Run Tests
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {embeddingsResults.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Query</th>
                    <th>Time</th>
                    <th>Results</th>
                    <th>Precision</th>
                    <th>Recall</th>
                  </tr>
                </thead>
                <tbody>
                  {embeddingsResults.map((result, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className='max-w-md truncate'>{result.query}</td>
                      <td>{formatTime(result.time)}</td>
                      <td>{result.received.length}</td>
                      <td>{formatPercent(result.precision)}</td>
                      <td>{formatPercent(result.recall)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generation' && (
        <div className='flex flex-col gap-6'>
          <div className='flex flex-wrap gap-4'>
            <div className='stats shadow'>
              <div className='stat'>
                <div className='stat-title'>Average Generation Time</div>
                <div className='stat-value'>
                  {formatTime(generationStats.avgTime)}
                </div>
                <div className='stat-desc'>Total processing time</div>
              </div>
            </div>

            <div className='stats shadow'>
              <div className='stat'>
                <div className='stat-title'>Avg. Tokens</div>
                <div className='stat-value'>
                  {generationStats.avgTokens.toFixed(0)}
                </div>
                <div className='stat-desc'>Per response</div>
              </div>
              <div className='stat'>
                <div className='stat-title'>Avg. Speed</div>
                <div className='stat-value'>
                  {generationStats.avgTps.toFixed(1)}
                </div>
                <div className='stat-desc'>Tokens per second</div>
              </div>
            </div>
          </div>

          <div className='card bg-base-200 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title'>Generation Performance</h2>
              <div className='h-80 w-full'>
                {generationResults.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart
                      data={generationResults}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='id' />
                      <YAxis
                        yAxisId='left'
                        orientation='left'
                        stroke='#8884d8'
                      />
                      <YAxis
                        yAxisId='right'
                        orientation='right'
                        stroke='#82ca9d'
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'generationTime' || name === 'totalTime')
                            return formatTime(value as number);
                          return value;
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId='left'
                        type='monotone'
                        dataKey='tps'
                        name='Tokens/sec'
                        stroke='#8884d8'
                      />
                      <Line
                        yAxisId='right'
                        type='monotone'
                        dataKey='numTokens'
                        name='Tokens'
                        stroke='#82ca9d'
                      />
                      <Line
                        yAxisId='left'
                        type='monotone'
                        dataKey='generationTime'
                        name='Generation Time'
                        stroke='#ffc658'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <div className='flex flex-col items-center gap-4 text-base-content/50'>
                      <VscInfo className='h-12 w-12' />
                      <p>Run tests to see results</p>
                    </div>
                  </div>
                )}
              </div>
              <div className='card-actions justify-end'>
                <button
                  className='btn btn-primary'
                  onClick={handleRunGenerationTests}
                  disabled={runGenerationTests || loading}
                >
                  {loading && runGenerationTests ? (
                    <>
                      <span className='loading loading-spinner'></span>
                      Testing {generationProgress + 1}/{testQueries.length}
                    </>
                  ) : (
                    <>
                      <VscDebugStart className='h-5 w-5' />
                      Run Tests
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {generationResults.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Query</th>
                    <th>Time</th>
                    <th>Tokens</th>
                    <th>Speed (tokens/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {generationResults.map((result, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className='max-w-md truncate'>{result.query}</td>
                      <td>{formatTime(result.totalTime)}</td>
                      <td>{result.numTokens}</td>
                      <td>{result.tps.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Evaluation;
