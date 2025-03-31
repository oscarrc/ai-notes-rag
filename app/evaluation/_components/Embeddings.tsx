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
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { VscDebugStart, VscInfo } from 'react-icons/vsc';
import { formatPercent, formatTime } from '../_utils/format';
import { useEffect, useState } from 'react';

import { testQueries } from '../_utils/queries';
import { useAi } from '../../_hooks/useAi';
import { useToast } from '../../_hooks/useToast';

const Embeddings = () => {
  const { getEmbeddings, fetchEmbeddings } = useAi();
  const { showToast } = useToast();

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

  const [loading, setLoading] = useState(false);

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

  const handleStopTests = () => {
    setEmbeddingsResults([]);
    setEmbeddingProgress(0);
    setRunEmbeddingsTest(false);
    setLoading(false);
  };

  // Reset test handlers
  const handleRunEmbeddingTests = () => {
    setEmbeddingsResults([]);
    setEmbeddingProgress(0);
    setRunEmbeddingsTest(true);

    showToast({
      message: 'Starting embedding tests...',
      type: 'info',
      duration: 3000,
    });
  };

  const valueFormatter = (value: ValueType, name: NameType) => {
    if (name === 'Avg Response Time') return formatTime(value as number);
    if (['Precision', 'Recall', 'F1 Score'].includes(name as string))
      return formatPercent(value as number);
    return value;
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Overall stats */}
      <div className='stats w-full shadow'>
        <div className='stat'>
          <div className='stat-title'>Average Response Time</div>
          <div className='stat-value'>{formatTime(embeddingStats.avgTime)}</div>
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
        <div className='stat'>
          <div className='stat-value flex flex-col items-center justify-center gap-2'>
            <button
              className='btn btn-outline btn-primary btn-block'
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

            <button
              className='btn btn-outline btn-secondary btn-xs btn-block'
              onClick={handleStopTests}
              disabled={!runEmbeddingsTest}
            >
              Stop Tests
            </button>
          </div>
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
          <h2 className='card-title'>Overall Performance</h2>
          <div className='flex h-80 w-full flex-col gap-8'>
            {embeddingsResults.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={embeddingsResults}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='id' />
                  <YAxis yAxisId='left' orientation='left' stroke='#8884d8' />
                  <YAxis yAxisId='right' orientation='right' stroke='#82ca9d' />
                  <Tooltip formatter={valueFormatter} />
                  <Legend />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='time'
                    name='Time'
                    stroke='#8884d8'
                  />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='precision'
                    name='Precision'
                    stroke='#82ca9d'
                  />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='recall'
                    name='Recall'
                    stroke='#ffc658'
                  />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='f1Score'
                    name='F1 Score'
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
        </div>
      </div>

      <div className='card bg-base-200'>
        <div className='card-body'>
          <h2 className='card-title'>Performance by category</h2>
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
                    formatter={valueFormatter}
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
  );
};

export default Embeddings;
