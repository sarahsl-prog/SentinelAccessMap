import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../types';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick: (node: NetworkNode) => void;
  width?: number;
  height?: number;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  nodes, 
  links, 
  onNodeClick, 
  width = 800, 
  height = 600,
  reducedMotion = false,
  highContrast = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Prepare data clone to avoid mutating props directly in D3
  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    };
  }, [nodes, links]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const simulation = d3.forceSimulation(graphData.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // ACCESSIBILITY: If Reduced Motion is requested, increase decay to settle faster
    if (reducedMotion) {
      simulation.alphaDecay(0.15); 
    }

    // Links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke", highContrast ? "#ffffff" : "#475569") // White in HC mode
      .attr("stroke-width", highContrast ? 4 : 2) // Thicker in HC mode
      .attr("opacity", highContrast ? 1 : 0.6);

    // Node Groups
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graphData.nodes)
      .enter().append("g")
      .attr("tabindex", 0) // Accessibility: Make nodes focusable
      .attr("role", "button")
      .attr("aria-label", d => `Node ${d.label}, Status: ${d.status}. Press Enter to view details.`)
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on("click", (event, d) => {
        // Map back to original node data structure
        const originalNode = nodes.find(n => n.id === d.id);
        if (originalNode) onNodeClick(originalNode);
      })
      .on("keydown", (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const originalNode = nodes.find(n => n.id === d.id);
          if (originalNode) onNodeClick(originalNode);
        }
      });

    // Node Circles
    node.append("circle")
      .attr("r", 20)
      .attr("fill", (d: any) => {
        if (d.status === 'critical') return highContrast ? '#ff0000' : '#ef4444'; 
        if (d.status === 'warning') return highContrast ? '#ffa500' : '#f59e0b';
        return highContrast ? '#0000ff' : '#3b82f6';
      })
      .attr("stroke", highContrast ? "#ffff00" : "#fff") // Yellow stroke for high contrast visibility
      .attr("stroke-width", highContrast ? 3 : 1.5)
      .attr("class", reducedMotion ? "cursor-pointer" : "transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg");

    // Icons/Labels inside nodes
    node.append("text")
      .attr("dx", 0)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text(d => d.type.charAt(0).toUpperCase());

    // Labels below nodes
    node.append("text")
      .attr("dx", 0)
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", highContrast ? "#ffffff" : "#cbd5e1")
      .style("font-size", highContrast ? "14px" : "12px")
      .style("font-weight", highContrast ? "bold" : "normal")
      .text(d => d.label);

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [graphData, width, height, nodes, onNodeClick, reducedMotion, highContrast]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative">
      <div className="absolute top-2 left-2 z-10 bg-slate-800/80 p-2 rounded text-xs text-slate-400">
        <p>Graph View (Interactive)</p>
        <p className="mt-1">Use <span className="font-mono text-white">Tab</span> to navigate nodes.</p>
        {reducedMotion && <p className="mt-1 text-amber-400 font-bold">Reduced Motion Active</p>}
      </div>
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full focus:outline-none"
        aria-label="Network Topology Graph"
      />
    </div>
  );
};

export default NetworkGraph;