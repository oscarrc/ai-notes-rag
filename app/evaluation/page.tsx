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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VscDebugStart, VscInfo } from 'react-icons/vsc';
import { formatPercent, formatTime } from './_utils/format';

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
  const currentPerfRef = useRef(null);

  // Track current performance for the current test
  useEffect(() => {
    currentPerfRef.current = { ...performance };
  }, [performance]);

  // State for test results
  const [embeddingsResults, setEmbeddingsResults] = useState<any[]>([]);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [runEmbeddingsTest, setRunEmbeddingsTest] = useState(false);
  const [embeddingStats, setEmbeddingStats] = useState<{
    avgTime: number;
    precision: number;
    recall: number;
    f1Score: number;
    byCategory?: Record<
      string,
      {
        avgTime: number;
        precision: number;
        recall: number;
        f1Score: number;
        count: number;
      }
    >;
  }>({
    avgTime: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  });

  const [generationResults, setGenerationResults] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [runGenerationTests, setRunGenerationTests] = useState(false);
  const [generationStats, setGenerationStats] = useState<{
    avgProcessingTime: number;
    avgGenerationTime: number;
    avgTps: number;
    avgTokens: number;
    byCategory?: Record<
      string,
      {
        avgProcessingTime: number;
        avgGenerationTime: number;
        avgTps: number;
        avgTokens: number;
        count: number;
      }
    >;
  }>({
    avgProcessingTime: 0,
    avgGenerationTime: 0,
    avgTps: 0,
    avgTokens: 0,
    byCategory: {},
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('embeddings');

  // Run embeddings test
  const testEmbeddings = async () => {
    setLoading(true);
    try {
      console.log(
        `Running embedding test ${embeddingProgress + 1}/${testQueries.length}`
      );
      showToast({
        message: `Running embedding test ${embeddingProgress + 1}/${testQueries.length}`,
        type: 'info',
        duration: 2000,
      });

      const start = Date.now();
      const query = await getEmbeddings(testQueries[embeddingProgress].query);
      const docs = await fetchEmbeddings(query);
      const end = Date.now();

      const receivedDocIds = docs.map((r: EmbeddingRecord) => r.path);
      const expectedDocIds =
        testQueries[embeddingProgress].relevantDocIds || [];

      // Calculate precision and recall
      const isOutOfScope =
        testQueries[embeddingProgress].category === 'out-of-scope';

      const truePositives = receivedDocIds.filter((id: string) =>
        expectedDocIds.includes(id)
      ).length;

      // Calculate precision
      let precision = 0;
      if (isOutOfScope && receivedDocIds.length === 0) {
        // Perfect precision for out-of-scope when nothing returned
        precision = 1;
      } else if (receivedDocIds.length > 0) {
        // Normal precision calculation when results returned
        precision = truePositives / receivedDocIds.length;
      } else if (expectedDocIds.length === 0) {
        // If no expected docs and no results, that's good
        precision = 1;
      }

      // Calculate recall
      const recall =
        expectedDocIds.length > 0 ? truePositives / expectedDocIds.length : 1;

      const f1Score =
        precision + recall > 0
          ? (2 * (precision * recall)) / (precision + recall)
          : 0;

      const result = {
        id: embeddingProgress,
        query: testQueries[embeddingProgress].query,
        category: testQueries[embeddingProgress].category,
        time: end - start,
        expected: expectedDocIds,
        received: receivedDocIds,
        precision,
        recall,
        f1Score,
      };

      setLoading(false);
      setEmbeddingsResults((prev) => [...prev, result]);
      setEmbeddingProgress((prev) => prev + 1);
    } catch (error) {
      console.error('Embedding test error:', error);
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
      console.log(
        `Running generation test ${generationProgress + 1}/${testQueries.length}`
      );
      showToast({
        message: `Running generation test ${generationProgress + 1}/${testQueries.length}`,
        type: 'info',
        duration: 2000,
      });

      // Reset the current performance reference
      currentPerfRef.current = null;

      const start = Date.now();
      await generateAnswer(testQueries[generationProgress].query);
      const end = Date.now();

      const result = {
        id: generationProgress,
        query: testQueries[generationProgress].query,
        category: testQueries[generationProgress].category,
        processingTime: end - start,
        numTokens: performance.numTokens || 0,
        tps: performance.tps || 0,
        generationTime: performance.totalTime || 0,
      };

      setLoading(false);
      setGenerationResults((prev) => [...prev, result]);
      setGenerationProgress((prev) => prev + 1);
    } catch (error) {
      console.error('Generation test error:', error);
      setLoading(false);
      showToast({
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        duration: 3000,
      });
    }
  };

  // Calculate statistics when results change, grouped by category
  useEffect(() => {
    if (embeddingsResults.length === 0) return;

    // Overall stats
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

    // Group results by category
    const categorizedResults = {
      direct: embeddingsResults.filter((r) => r.category === 'direct'),
      inferential: embeddingsResults.filter(
        (r) => r.category === 'inferential'
      ),
      'out-of-scope': embeddingsResults.filter(
        (r) => r.category === 'out-of-scope'
      ),
    };

    // Calculate stats for each category
    const categoryStats = Object.entries(categorizedResults).reduce(
      (stats, [category, results]) => {
        if (results.length === 0) return stats;

        const categoryAvgTime =
          results.reduce((sum, r) => sum + r.time, 0) / results.length;
        const categoryPrecision =
          results.reduce((sum, r) => sum + r.precision, 0) / results.length;
        const categoryRecall =
          results.reduce((sum, r) => sum + r.recall, 0) / results.length;
        const categoryF1Score =
          results.reduce((sum, r) => sum + r.f1Score, 0) / results.length;

        return {
          ...stats,
          [category]: {
            avgTime: categoryAvgTime,
            precision: categoryPrecision,
            recall: categoryRecall,
            f1Score: categoryF1Score,
            count: results.length,
          },
        };
      },
      {}
    );

    setEmbeddingStats({
      avgTime,
      precision,
      recall,
      f1Score,
      byCategory: categoryStats,
    });
  }, [embeddingsResults]);

  useEffect(() => {
    if (generationResults.length === 0) return;

    const avgProcessingTime =
      generationResults.reduce((sum, r) => sum + r.processingTime, 0) /
      generationResults.length;
    const avgGenerationTime =
      generationResults.reduce((sum, r) => sum + r.generationTime, 0) /
      generationResults.length;
    const avgTps =
      generationResults.reduce((sum, r) => sum + r.tps, 0) /
      generationResults.length;
    const avgTokens =
      generationResults.reduce((sum, r) => sum + r.numTokens, 0) /
      generationResults.length;

    // Group results by category
    const categorizedResults = {
      direct: generationResults.filter((r) => r.category === 'direct'),
      inferential: generationResults.filter(
        (r) => r.category === 'inferential'
      ),
      'out-of-scope': generationResults.filter(
        (r) => r.category === 'out-of-scope'
      ),
    };

    // Calculate stats for each category
    const categoryStats = Object.entries(categorizedResults).reduce(
      (stats, [category, results]) => {
        if (results.length === 0) return stats;

        const categoryAvgProcessingTime =
          results.reduce((sum, r) => sum + r.processingTime, 0) /
          results.length;
        const categoryAvgGenerationTime =
          results.reduce((sum, r) => sum + r.generationTime, 0) /
          results.length;
        const categoryAvgTps =
          results.reduce((sum, r) => sum + r.tps, 0) / results.length;
        const categoryAvgTokens =
          results.reduce((sum, r) => sum + r.numTokens, 0) / results.length;

        return {
          ...stats,
          [category]: {
            avgProcessingTime: categoryAvgProcessingTime,
            avgGenerationTime: categoryAvgGenerationTime,
            avgTps: categoryAvgTps,
            avgTokens: categoryAvgTokens,
            count: results.length,
          },
        };
      },
      {}
    );

    setGenerationStats({
      avgProcessingTime,
      avgGenerationTime,
      avgTps,
      avgTokens,
      byCategory: categoryStats,
    });
  }, [generationResults]);

  // Run tests automatically when flags are set
  useEffect(() => {
    if (!runEmbeddingsTest) return;

    const runTest = async () => {
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

      if (!loading) {
        await testEmbeddings();
      }
    };

    runTest();
  }, [runEmbeddingsTest, loading, embeddingProgress]);

  useEffect(() => {
    if (!runGenerationTests) return;

    const runTest = async () => {
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

      if (!loading && (status === 'idle' || status === 'ready')) {
        await testGeneration();
      }
    };

    runTest();
  }, [runGenerationTests, loading, generationProgress, status]);

  useEffect(() => {
    if (!runGenerationTests) return;
    if (!loading) return;
    if (status === 'idle' || status === 'ready') {
      setEmbeddingsResults((prev) => {
        if (prev.length === 0) return prev;

        const results = [...prev];
        results[generationProgress - 1] = {
          ...results[generationProgress - 1],
          numTokens: performance.numTokens || 0,
          tps: performance.tps || 0,
          generationTime: performance.totalTime || 0,
        };

        return results;
      });
    }
  }, [runGenerationTests, loading, status, performance]);

  // Reset test handlers
  const handleRunEmbeddingTests = () => {
    console.log('Starting embedding tests');
    setEmbeddingsResults([]);
    setEmbeddingProgress(0);
    setRunEmbeddingsTest(true);

    showToast({
      message: 'Starting embedding tests...',
      type: 'info',
      duration: 3000,
    });
  };

  const handleRunGenerationTests = () => {
    setGenerationResults([]);
    setGenerationProgress(0);
    setRunGenerationTests(true);

    showToast({
      message: 'Starting generation tests...',
      type: 'info',
      duration: 3000,
    });
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
          {/* Overall stats */}
          <div className='stats w-full shadow'>
            <div className='stat'>
              <div className='stat-title'>Average Response Time</div>
              <div className='stat-value'>
                {formatTime(embeddingStats.avgTime)}
              </div>
              <div className='stat-desc'>For vector search operations</div>
            </div>
            <div className='stat'>
              <div className='stat-title'>Overall Precision</div>
              <div className='stat-value'>
                {formatPercent(embeddingStats.precision)}
              </div>
              <div className='stat-desc'>Relevant/Retrieved</div>
            </div>
            <div className='stat'>
              <div className='stat-title'>Overall Recall</div>
              <div className='stat-value'>
                {formatPercent(embeddingStats.recall)}
              </div>
              <div className='stat-desc'>Found/Total Relevant</div>
            </div>
            <div className='stat'>
              <div className='stat-title'>Overall F1 Score</div>
              <div className='stat-value'>
                {formatPercent(embeddingStats.f1Score)}
              </div>
              <div className='stat-desc'>Balanced Accuracy</div>
            </div>
          </div>

          {/* Stats by category */}
          {embeddingStats.byCategory && (
            <div className='overflow-x-auto'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Avg Time</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1 Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(embeddingStats.byCategory).map(
                    ([category, stats]) => (
                      <tr key={category}>
                        <td className='font-medium capitalize'>{category}</td>
                        <td>{stats.count}</td>
                        <td>{formatTime(stats.avgTime)}</td>
                        <td>{formatPercent(stats.precision)}</td>
                        <td>{formatPercent(stats.recall)}</td>
                        <td>{formatPercent(stats.f1Score)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className='card bg-base-200'>
            <div className='card-body'>
              <h2 className='card-title'>Semantic Search Performance</h2>
              <div className='h-80 w-full'>
                {embeddingStats.byCategory ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={Object.entries(embeddingStats.byCategory).map(
                        ([category, stats]) => ({
                          category,
                          precision: stats.precision,
                          recall: stats.recall,
                          f1Score: stats.f1Score,
                          time: stats.avgTime,
                        })
                      )}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='category' />
                      <YAxis
                        yAxisId='left'
                        orientation='left'
                        stroke='#8884d8'
                        domain={[0, 1000]}
                      />
                      <YAxis
                        yAxisId='right'
                        orientation='right'
                        stroke='#82ca9d'
                        domain={[0, 1]}
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
                        labelFormatter={(value) => `Category: ${value}`}
                      />
                      <Legend />
                      <Bar
                        yAxisId='left'
                        dataKey='time'
                        name='Avg Response Time'
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
                      <Bar
                        yAxisId='right'
                        dataKey='f1Score'
                        name='F1 Score'
                        fill='#ff8042'
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
                    <th>Category</th>
                    <th>Query</th>
                    <th>Time</th>
                    <th>Results</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1</th>
                  </tr>
                </thead>
                <tbody>
                  {embeddingsResults.map((result, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className='capitalize'>{result.category}</td>
                      <td className='max-w-md truncate'>{result.query}</td>
                      <td>{formatTime(result.time)}</td>
                      <td>{result.received.length}</td>
                      <td>{formatPercent(result.precision)}</td>
                      <td>{formatPercent(result.recall)}</td>
                      <td>{formatPercent(result.f1Score)}</td>
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
            <div className='stats w-full shadow'>
              <div className='stat'>
                <div className='stat-title'>Average Processing Time</div>
                <div className='stat-value'>
                  {formatTime(generationStats.avgProcessingTime)}
                </div>
                <div className='stat-desc'>Total Processing time</div>
              </div>
              <div className='stat'>
                <div className='stat-title'>Average Generation Time</div>
                <div className='stat-value'>
                  {formatTime(generationStats.avgGenerationTime)}
                </div>
                <div className='stat-desc'>Model Generation Time</div>
              </div>
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

          {/* Stats by category */}
          {generationStats.byCategory &&
            Object.keys(generationStats.byCategory).length > 0 && (
              <div className='overflow-x-auto'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Processing Time</th>
                      <th>Generation Time</th>
                      <th>Tokens</th>
                      <th>Speed (tokens/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(generationStats.byCategory).map(
                      ([category, stats]) => (
                        <tr key={category}>
                          <td className='font-medium capitalize'>{category}</td>
                          <td>{stats.count}</td>
                          <td>{formatTime(stats.avgProcessingTime)}</td>
                          <td>{formatTime(stats.avgGenerationTime)}</td>
                          <td>{stats.avgTokens.toFixed(0)}</td>
                          <td>{stats.avgTps.toFixed(1)}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

          <div className='card bg-base-200'>
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
                          if (
                            name === 'generationTime' ||
                            name === 'processingTime'
                          )
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
                      <Line
                        yAxisId='left'
                        type='monotone'
                        dataKey='processingTime'
                        name='Processing Time'
                        stroke='#ff8042'
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

          {/* Generation Performance by Category Chart */}
          <div className='card mt-6 bg-base-200'>
            <div className='card-body'>
              <h2 className='card-title'>Generation Performance by Category</h2>
              <div className='h-80 w-full'>
                {generationStats.byCategory &&
                Object.keys(generationStats.byCategory).length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={Object.entries(generationStats.byCategory).map(
                        ([category, stats]) => ({
                          category,
                          processingTime: stats.avgProcessingTime,
                          generationTime: stats.avgGenerationTime,
                          tokens: stats.avgTokens,
                          tps: stats.avgTps,
                        })
                      )}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='category' />
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
                          if (
                            name === 'processingTime' ||
                            name === 'generationTime'
                          )
                            return formatTime(value as number);
                          return value;
                        }}
                        labelFormatter={(value) => `Category: ${value}`}
                      />
                      <Legend />
                      <Bar
                        yAxisId='left'
                        dataKey='processingTime'
                        name='Processing Time'
                        fill='#8884d8'
                      />
                      <Bar
                        yAxisId='left'
                        dataKey='generationTime'
                        name='Generation Time'
                        fill='#82ca9d'
                      />
                      <Bar
                        yAxisId='right'
                        dataKey='tokens'
                        name='Tokens'
                        fill='#ffc658'
                      />
                      <Bar
                        yAxisId='left'
                        dataKey='tps'
                        name='Tokens/sec'
                        fill='#ff8042'
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
            </div>
          </div>

          {generationResults.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Query</th>
                    <th>Generation Time</th>
                    <th>Processing Time</th>
                    <th>Tokens</th>
                    <th>Speed (tokens/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {generationResults.map((result, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className='capitalize'>{result.category}</td>
                      <td className='max-w-md truncate'>{result.query}</td>
                      <td>{formatTime(result.generationTime)}</td>
                      <td>{formatTime(result.processingTime)}</td>
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
