'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { FlowData, FlowNode, FlowEdge, TokenCategory } from '@/types/flow';
import { FlowTooltip } from './FlowTooltip';
import { formatUSD } from '@/lib/format';

interface FlowGraphProps {
  data: FlowData;
  categories: Record<TokenCategory, boolean>;
  topN: number;
}

const CATEGORY_COLORS: Record<TokenCategory, string> = {
  stablecoin: '#00d4aa',
  defi: '#008ffb',
  meme: '#feb019',
  lst: '#9b59b6',
  major: '#e0e6ed',
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  symbol: string;
  category: TokenCategory;
  totalVolume: number;
  txCount: number;
  r: number;
}

interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  volume: number;
  txCount: number;
  protocols: string[];
}

export function FlowGraph({ data, categories, topN }: FlowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    node?: FlowNode | null;
    edge?: FlowEdge | null;
    x: number;
    y: number;
  } | null>(null);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    svg.attr('width', width).attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Filter nodes by category and topN
    const filteredNodes = data.nodes
      .filter(n => categories[n.category])
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, topN);

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    const filteredEdges = data.edges.filter(
      e => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    if (filteredNodes.length === 0) return;

    // Scales
    const volumeExtent = d3.extent(filteredNodes, d => d.totalVolume) as [number, number];
    const radiusScale = d3.scaleSqrt().domain(volumeExtent).range([8, 40]);
    const edgeVolumeExtent = d3.extent(filteredEdges, d => d.volume) as [number, number];
    const edgeWidthScale = d3.scaleLinear().domain(edgeVolumeExtent.every(v => v != null) ? edgeVolumeExtent : [0, 1]).range([1, 6]);
    const edgeOpacityScale = d3.scaleLinear().domain(edgeVolumeExtent.every(v => v != null) ? edgeVolumeExtent : [0, 1]).range([0.15, 0.6]);

    // Simulation nodes
    const simNodes: SimNode[] = filteredNodes.map(n => ({
      ...n,
      r: radiusScale(n.totalVolume),
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const nodeMap = new Map(simNodes.map(n => [n.id, n]));

    const simEdges: SimEdge[] = filteredEdges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        source: e.source,
        target: e.target,
        volume: e.volume,
        txCount: e.txCount,
        protocols: e.protocols,
      }));

    // Zoom
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Cluster regions (faint backgrounds) - create once, update on tick
    const categoryGroups = d3.group(simNodes, d => d.category);
    const clusterG = g.append('g').attr('class', 'clusters');

    // Pre-create cluster circles
    const clusterCircles = new Map<TokenCategory, d3.Selection<SVGCircleElement, unknown, null, undefined>>();
    categoryGroups.forEach((nodes, category) => {
      if (!categories[category]) return;
      if (nodes.length < 2) return;
      const circle = clusterG.append('circle')
        .attr('fill', CATEGORY_COLORS[category])
        .attr('opacity', 0.05);
      clusterCircles.set(category, circle);
    });

    // Edges
    const edgeG = g.append('g').attr('class', 'edges');
    const edgeLines = edgeG.selectAll<SVGLineElement, SimEdge>('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', '#6b7d93')
      .attr('stroke-width', d => edgeWidthScale(d.volume))
      .attr('stroke-opacity', d => edgeOpacityScale(d.volume))
      .on('mouseover', (event, d) => {
        const src = typeof d.source === 'object' ? d.source : nodeMap.get(d.source as string);
        const tgt = typeof d.target === 'object' ? d.target : nodeMap.get(d.target as string);
        const symbols = new Map<string, string>();
        if (src) symbols.set(src.id, src.symbol);
        if (tgt) symbols.set(tgt.id, tgt.symbol);
        setTooltip({
          edge: {
            source: src?.id ?? '',
            target: tgt?.id ?? '',
            volume: d.volume,
            txCount: d.txCount,
            protocols: d.protocols,
          },
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseout', hideTooltip);

    // Nodes
    const nodeG = g.append('g').attr('class', 'nodes');
    const nodeGroups = nodeG.selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'grab');

    nodeGroups.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => CATEGORY_COLORS[d.category])
      .attr('fill-opacity', 0.2)
      .attr('stroke', d => CATEGORY_COLORS[d.category])
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.8);

    // Labels
    nodeGroups.append('text')
      .text(d => d.symbol)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', 'var(--text)')
      .attr('font-size', d => Math.max(9, Math.min(13, d.r * 0.6)))
      .attr('font-family', 'var(--font-mono)')
      .attr('font-weight', 500)
      .attr('pointer-events', 'none');

    nodeGroups.append('text')
      .text(d => formatUSD(d.totalVolume))
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('fill', 'var(--text-dim)')
      .attr('font-size', d => Math.max(8, Math.min(10, d.r * 0.45)))
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none');

    // Hover
    nodeGroups
      .on('mouseover', (event, d) => {
        setTooltip({
          node: { id: d.id, symbol: d.symbol, category: d.category, totalVolume: d.totalVolume, txCount: d.txCount },
          x: event.clientX,
          y: event.clientY,
        });
        d3.select(event.currentTarget).select('circle')
          .attr('fill-opacity', 0.4)
          .attr('stroke-width', 2.5);
      })
      .on('mousemove', (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseout', (event) => {
        hideTooltip();
        d3.select(event.currentTarget).select('circle')
          .attr('fill-opacity', 0.2)
          .attr('stroke-width', 1.5);
      });

    // Drag
    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(drag);

    // Simulation
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimEdge>(simEdges)
        .id(d => d.id)
        .distance(d => 100 + (d.volume > 0 ? 50 / Math.log10(d.volume + 1) : 50))
        .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>().radius(d => d.r + 8).strength(0.7))
      .on('tick', () => {
        edgeLines
          .attr('x1', d => (d.source as SimNode).x!)
          .attr('y1', d => (d.source as SimNode).y!)
          .attr('x2', d => (d.target as SimNode).x!)
          .attr('y2', d => (d.target as SimNode).y!);

        nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);

        // Update cluster region positions
        categoryGroups.forEach((nodes, category) => {
          const circle = clusterCircles.get(category);
          if (!circle) return;
          const cx = d3.mean(nodes, n => n.x) ?? 0;
          const cy = d3.mean(nodes, n => n.y) ?? 0;
          const maxDist = d3.max(nodes, n =>
            Math.sqrt((n.x! - cx) ** 2 + (n.y! - cy) ** 2) + n.r
          ) ?? 50;
          circle.attr('cx', cx).attr('cy', cy).attr('r', maxDist + 30);
        });
      });

    return () => {
      simulation.stop();
    };
  }, [data, categories, topN, hideTooltip]);

  // Build nodeSymbols for tooltip
  const nodeSymbols = new Map(data.nodes.map(n => [n.id, n.symbol]));

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <FlowTooltip
          node={tooltip.node}
          edge={tooltip.edge}
          nodeSymbols={nodeSymbols}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  );
}
