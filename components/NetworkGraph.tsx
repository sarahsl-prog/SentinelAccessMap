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
      .force("charge", d3.forceManyBody().strength(-500))
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
      .attr("aria-label", d => `${d.type} ${d.label}, Status: ${d.status}. Press Enter to view details.`)
      .style("outline", "none") // Remove default browser focus ring
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on("click", (event, d) => {
        const originalNode = nodes.find(n => n.id === d.id);
        if (originalNode) onNodeClick(originalNode);
      })
      .on("keydown", (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const originalNode = nodes.find(n => n.id === d.id);
          if (originalNode) onNodeClick(originalNode);
        }
      })
      // Accessibility: Visual Focus Indicator
      .on("focus", (event, d) => {
          d3.select(event.currentTarget).select("path")
            .attr("stroke", "#38bdf8") // sky-400 (Cyan/Blue glow)
            .attr("stroke-width", 5)
            .style("filter", "drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))");
      })
      .on("blur", (event, d) => {
          d3.select(event.currentTarget).select("path")
            .attr("stroke", highContrast ? "#ffff00" : "#fff")
            .attr("stroke-width", highContrast ? 3 : 2)
            .style("filter", null); // Revert to class-based shadow if applicable
      });

    // Helper to get shape path based on type
    const getNodePath = (type: string) => {
        const s = 22; // base scale size
        switch (type) {
            case 'router': // Diamond
                return `M0,-${s*1.3} L${s*1.3},0 L0,${s*1.3} L-${s*1.3},0 Z`;
            case 'firewall': // Square
                return `M-${s},-${s} L${s},-${s} L${s},${s} L-${s},${s} Z`;
            case 'database': // Hexagon
                return `M-${s*0.6},-${s*1.1} L${s*0.6},-${s*1.1} L${s*1.1},0 L${s*0.6},${s*1.1} L-${s*0.6},${s*1.1} L-${s*1.1},0 Z`;
            case 'server': // Vertical Rect
                return `M-${s*0.8},-${s*1.1} L${s*0.8},-${s*1.1} L${s*0.8},${s*1.1} L-${s*0.8},${s*1.1} Z`;
            case 'workstation': // Circle
            default:
                // Circle path approximation
                return `M 0, 0 m -${s}, 0 a ${s},${s} 0 1,0 ${s * 2},0 a ${s},${s} 0 1,0 -${s * 2},0`;
        }
    };

    // Helper to get status color
    const getStatusColor = (status: string) => {
        if (status === 'critical') return highContrast ? '#ff0000' : '#ef4444'; 
        if (status === 'warning') return highContrast ? '#ffa500' : '#f59e0b';
        return highContrast ? '#0000ff' : '#3b82f6'; // Secure
    };

    // Node Shapes (Path)
    node.append("path")
      .attr("d", d => getNodePath(d.type))
      .attr("fill", (d: any) => getStatusColor(d.status))
      .attr("stroke", highContrast ? "#ffff00" : "#fff") // Yellow stroke for high contrast visibility
      .attr("stroke-width", highContrast ? 3 : 2)
      .attr("class", reducedMotion ? "cursor-pointer" : "transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg drop-shadow-md");

    // Icons/Labels inside nodes
    node.append("text")
      .attr("dx", 0)
      .attr("dy", 5) // Center vertically
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text(d => {
          // Return a short code or icon representation
          switch(d.type) {
              case 'router': return 'R';
              case 'firewall': return 'FW';
              case 'database': return 'DB';
              case 'server': return 'SVR';
              case 'workstation': return 'WS';
              default: return (d.type as string).charAt(0).toUpperCase();
          }
      });

    // Labels below nodes
    node.append("text")
      .attr("dx", 0)
      .attr("dy", 40)
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
      <div className="absolute top-2 left-2 z-10 bg-slate-800/80 p-2 rounded text-xs text-slate-400 pointer-events-none">
        <p className="font-bold text-slate-300 border-b border-slate-600 mb-1 pb-1">Legend</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span>◆ Router</span>
            <span>■ Firewall</span>
            <span>⬢ Database</span>
            <span>▮ Server</span>
            <span>● Workstation</span>
        </div>
        {reducedMotion && <p className="mt-2 text-amber-400 font-bold border-t border-slate-600 pt-1">Reduced Motion</p>}
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