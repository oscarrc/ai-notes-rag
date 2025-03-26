'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import ForceGraph2D from 'react-force-graph-2d';
import useDebounce from '@/app/_hooks/useDebounce';
import useNavigationStore from '@/app/_store/navigationStore';

const DEFAULT_THRESHOLD = 0.7;
const MAX_NODES = 100; // Limit the number of nodes for performance

const GraphView = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const { addTab } = useNavigationStore();
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce threshold changes to prevent too many API calls
  const debouncedThreshold = useDebounce(threshold, 500);

  // Optimize the fetch function to get data in chunks if needed
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/embeddings?threshold=${debouncedThreshold}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const data = await response.json();

      // Limit the number of nodes for performance (prioritize folders)
      if (data.nodes.length > MAX_NODES) {
        // Keep all folder nodes
        const folderNodes = data.nodes.filter(
          (node: GraphNode) => node.isFolder
        );

        // Take remaining slots for non-folder nodes
        const remainingSlots = MAX_NODES - folderNodes.length;
        const fileNodes = data.nodes
          .filter((node: GraphNode) => !node.isFolder)
          .slice(0, remainingSlots);

        // Combine and get only the relevant links
        const limitedNodes = [...folderNodes, ...fileNodes];
        const nodeIds = new Set(limitedNodes.map((node: GraphNode) => node.id));

        const limitedLinks = data.links.filter(
          (link: any) => nodeIds.has(link.source) && nodeIds.has(link.target)
        );

        setGraphData({
          nodes: limitedNodes,
          links: limitedLinks,
        });
      } else {
        setGraphData(data);
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedThreshold]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Handle window resize to redraw the graph
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.d3Force('charge').strength(-50); // Reduce repulsion force
        graphRef.current.d3Force('link').distance(30); // Reduce link distance
        graphRef.current.d3Force('center', null); // Remove center force for better performance
        graphRef.current.refresh();
      }
    };

    window.addEventListener('resize', handleResize);

    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(200);
      }, 500);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [graphData]);

  const handleNodeClick = (node: GraphNode) => {
    if (!node.isFolder) {
      addTab({
        name: node.name,
        path: node.path,
      });
    }
  };

  if (loading) {
    return (
      <section className='flex h-full w-full items-center justify-center'>
        <div
          className='radial-progress animate-spin text-primary'
          style={{ '--value': 70 } as any}
        ></div>
      </section>
    );
  }

  // If too many nodes, show a warning
  const nodeLimitWarning =
    graphData?.nodes.length === MAX_NODES ? (
      <div className='alert alert-warning p-2 text-xs'>
        <span>
          Showing only {MAX_NODES} nodes for performance. Increase similarity
          threshold to see more specific connections.
        </span>
      </div>
    ) : null;

  return (
    <section className='relative flex h-full w-full flex-col'>
      <div className='absolute left-0 top-0 z-50 flex w-64 flex-col gap-2 p-4'>
        {nodeLimitWarning}
        <div className='form-control'>
          <label className='label'>
            <span className='label-text'>Similarity Threshold</span>
            <span className='label-text-alt'>{threshold.toFixed(2)}</span>
          </label>
          <input
            type='range'
            min='0.1'
            max='0.9'
            step='0.05'
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className='range range-primary range-xs'
          />
          <div className='flex w-full justify-between px-2 text-xs'>
            <span>0.1</span>
            <span>0.5</span>
            <span>0.9</span>
          </div>
        </div>
      </div>

      <div className='flex-1' ref={containerRef}>
        {graphData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeId='id'
            nodeLabel='name'
            nodeRelSize={4} // Smaller nodes
            width={containerRef.current?.clientWidth || 800}
            height={containerRef.current?.clientHeight || 600}
            linkWidth={1.5} // Thicker links for visibility
            linkColor={() => '#000'} // Fixed visible link color
            linkDirectionalParticles={1} // Add minimal particles for visibility
            d3AlphaDecay={0.01} // Slower stabilization for better layout
            d3VelocityDecay={0.2} // More movement for better structure
            warmupTicks={50} // More ticks for better layout
            cooldownTicks={50} // Fewer cooldown ticks
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              // Skip rendering if node is too far from center for performance
              const distFromCenter = Math.sqrt(
                Math.pow(node.x, 2) + Math.pow(node.y, 2)
              );
              if (distFromCenter > 500) return;

              // Simpler node rendering
              const size = node.val * (node.isFolder ? 2 : 1.5);

              // Fixed DaisyUI theme colors with hardcoded values for canvas
              const colorMap: Record<string, string> = {
                primary: '#570df8', // Primary color
                secondary: '#f000b8', // Secondary color
                accent: '#37cdbe', // Accent color
                info: '#3abff8', // Info color
                success: '#36d399', // Success color
                warning: '#fbbd23', // Warning color
                error: '#f87272', // Error color
                neutral: '#3d4451', // Neutral color for folders
              };

              // Get color from the map or use a default color
              let nodeColor = node.isFolder
                ? colorMap.neutral
                : colorMap[node.color] || '#888888';

              // Draw the node (simplified)
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
              ctx.fillStyle = nodeColor;
              ctx.fill();

              // Only draw folder outline if zoomed in
              if (node.isFolder && globalScale > 1) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 0.3;
                ctx.stroke();
              }

              // Only draw labels when zoomed in (reduces rendering load)
              if (globalScale > 2 && node.name) {
                const label =
                  node.name.length > 15
                    ? node.name.substring(0, 15) + '...'
                    : node.name;
                ctx.font = `${8 / globalScale}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(label, node.x, node.y + size + 2);
              }
            }}
            onNodeClick={handleNodeClick}
            onEngineStop={() => {
              graphRef.current?.zoomToFit(200, 50);
            }}
          />
        )}
      </div>
    </section>
  );
};

export default GraphView;
