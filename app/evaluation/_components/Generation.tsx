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
import { useEffect, useState } from 'react';

import { formatTime } from '../_utils/format';
import { testQueries } from '../_utils/queries';
import { useAi } from '../../_hooks/useAi';
import { useToast } from '../../_hooks/useToast';

const Generation = () => {
  const { generateAnswer, status, stopGeneration, resetChat } = useAi();

  const { showToast } = useToast();

  const [generationResults, setGenerationResults] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [runGenerationTests, setRunGenerationTests] = useState(false);
  const [generationStats, setGenerationStats] = useState<{
    avgGenerationTime: number;
    avgTps: number;
    avgTtf: number;
    avgTokens: number;
    byCategory?: Record<
      string,
      {
        avgGenerationTime: number;
        avgTps: number;
        avgTtf: number;
        avgTokens: number;
        count: number;
      }
    >;
  }>({
    avgGenerationTime: 0,
    avgTtf: 0,
    avgTps: 0,
    avgTokens: 0,
    byCategory: {},
  });

  const [loading, setLoading] = useState(false);

  // Run generation test
  const testGeneration = async () => {
    setLoading(true);
    resetChat();

    try {
      showToast({
        message: `Running generation test ${generationProgress + 1}/${testQueries.length}`,
        type: 'info',
        duration: 2000,
      });

      const response = await generateAnswer(
        testQueries[generationProgress].query
      );

      const performance = response?.performance;

      const result = {
        id: generationProgress,
        query: testQueries[generationProgress].query,
        category: testQueries[generationProgress].category,
        numTokens: performance?.numTokens || 0,
        tps: performance?.tps || 0,
        ttf: performance?.ttf || 0,
        generationTime: performance?.totalTime || 0,
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

  useEffect(() => {
    if (generationResults.length === 0) return;

    const avgGenerationTime =
      generationResults.reduce((sum, r) => sum + r.generationTime, 0) /
      generationResults.length;
    const avgTps =
      generationResults.reduce((sum, r) => sum + r.tps, 0) /
      generationResults.length;
    const avgTtf =
      generationResults.reduce((sum, r) => sum + r.ttf, 0) /
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

        const categoryAvgGenerationTime =
          results.reduce((sum, r) => sum + r.generationTime, 0) /
          results.length;
        const categoryAvgTps =
          results.reduce((sum, r) => sum + r.tps, 0) / results.length;
        const categoryAvgTtf =
          results.reduce((sum, r) => sum + r.ttf, 0) / results.length;
        const categoryAvgTokens =
          results.reduce((sum, r) => sum + r.numTokens, 0) / results.length;

        return {
          ...stats,
          [category]: {
            avgGenerationTime: categoryAvgGenerationTime,
            avgTps: categoryAvgTps,
            avgTtf: categoryAvgTtf,
            avgTokens: categoryAvgTokens,
            count: results.length,
          },
        };
      },
      {}
    );

    setGenerationStats({
      avgGenerationTime,
      avgTtf,
      avgTps,
      avgTokens,
      byCategory: categoryStats,
    });
  }, [generationResults]);

  // Run tests automatically when flags are set
  useEffect(() => {
    if (!runGenerationTests) return;

    const runTest = async () => {
      if (generationProgress >= testQueries.length) {
        resetChat();
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

      if (!loading) {
        await testGeneration();
      }
    };

    runTest();
  }, [runGenerationTests, loading, generationProgress, status]);

  const handleStopTests = async () => {
    setGenerationResults([]);
    setGenerationProgress(0);
    setRunGenerationTests(false);
    setLoading(false);

    await stopGeneration();
    resetChat();
  };

  // Reset test handlers
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

  const valueFormatter = (value: ValueType, name: NameType) => {
    if ((name as string).includes('Time')) return formatTime(value as number);
    if (name === 'Tokens/sec' || name === 'Delay')
      return (value as number).toFixed(2);
    return value;
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap gap-4'>
        <div className='stats w-full shadow'>
          <div className='stat'>
            <div className='stat-title'>Average Generation Time</div>
            <div className='stat-value'>
              {formatTime(generationStats.avgGenerationTime)}
            </div>
            <div className='stat-desc'>Model Generation Time</div>
          </div>
          <div className='stat'>
            <div className='stat-title'>Avg. Delay</div>
            <div className='stat-value'>
              {formatTime(generationStats.avgTtf)}
            </div>
            <div className='stat-desc'>Time to first token</div>
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
          <div className='stat'>
            <div className='stat-value flex flex-col items-center justify-center gap-2'>
              <button
                className='btn btn-outline btn-primary btn-block'
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
              <button
                className='btn btn-outline btn-secondary btn-xs btn-block'
                onClick={handleStopTests}
                disabled={!runGenerationTests}
              >
                Stop Tests
              </button>
            </div>
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
                  <th>Generation Time</th>
                  <th>Delay</th>
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
                      <td>{formatTime(stats.avgGenerationTime)}</td>
                      <td>{formatTime(stats.avgTtf)}</td>
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
          <h2 className='card-title'>Overall Performance</h2>
          <div className='flex h-80 w-full flex-col gap-8'>
            {generationResults.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={generationResults}
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
                    dataKey='tps'
                    name='Tokens/sec'
                    stroke='#ff8042'
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='numTokens'
                    name='Tokens'
                    stroke='#ffc658'
                  />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='generationTime'
                    name='Generation Time'
                    stroke='#82ca9d'
                  />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='ttf'
                    name='Delay'
                    stroke='#82caff'
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

      {/* Generation Performance by Category Chart */}
      <div className='card mt-6 bg-base-200'>
        <div className='card-body'>
          <h2 className='card-title'>Performance by Category</h2>
          <div className='h-80 w-full'>
            {generationStats.byCategory &&
            Object.keys(generationStats.byCategory).length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={Object.entries(generationStats.byCategory).map(
                    ([category, stats]) => ({
                      category,
                      generationTime: stats.avgGenerationTime,
                      tokens: stats.avgTokens,
                      tps: stats.avgTps,
                      ttf: stats.avgTtf,
                    })
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='category' />
                  <YAxis yAxisId='left' orientation='left' stroke='#8884d8' />
                  <YAxis yAxisId='right' orientation='right' stroke='#82ca9d' />
                  <Tooltip
                    formatter={valueFormatter}
                    labelFormatter={(value) => `Category: ${value}`}
                  />
                  <Legend />
                  <Bar
                    yAxisId='left'
                    dataKey='generationTime'
                    name='Generation Time'
                    fill='#82ca9d'
                  />
                  <Bar
                    yAxisId='left'
                    dataKey='ttf'
                    name='Delay'
                    fill='#82caff'
                  />
                  <Bar
                    yAxisId='right'
                    dataKey='tokens'
                    name='Tokens'
                    fill='#ffc658'
                  />
                  <Bar
                    yAxisId='right'
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
                <th>Delay</th>
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
                  <td>{formatTime(result.ttf)}</td>
                  <td>{result.numTokens}</td>
                  <td>{result.tps.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Generation;
