import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GitState, D3Node, D3Link } from '../../types/git';
import './GitGraph.css';

interface GitGraphProps {
  gitState: GitState;
}

const GitGraph: React.FC<GitGraphProps> = ({ gitState }) => {
  const graphRef = useRef<SVGSVGElement>(null);

  // Dimensiones del SVG y configuración del grafo
  const updateGraphDimensions = () => {
    if (!graphRef.current) return { width: 600, height: 400 };
    
    const container = graphRef.current.parentElement;
    if (!container) return { width: 600, height: 400 };
    
    return {
      width: container.clientWidth,
      height: container.clientHeight - 35 // Compensate for the title bar
    };
  };

  // Efecto para crear y actualizar el grafo D3
  useEffect(() => {
    if (!graphRef.current) return;
    
    // Limpiar SVG anterior
    d3.select(graphRef.current).selectAll("*").remove();
    
    const { width, height } = updateGraphDimensions();
    
    // Crear nodos y enlaces para D3
    const nodes: D3Node[] = gitState.commits.map(commit => ({
      id: commit.id,
      commit,
      x: undefined,
      y: undefined
    }));
    
    const links: D3Link[] = [];
    
    // Crear enlaces entre commits
    gitState.commits.forEach(commit => {
      if (commit.parent) {
        links.push({
          source: commit.id,
          target: commit.parent
        });
      }
      
      if (commit.secondParent) {
        links.push({
          source: commit.id,
          target: commit.secondParent,
          isMerge: true
        });
      }
    });

    // Crear elementos SVG
    const svg = d3.select(graphRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    
    // Crear contenedor con zoom y centrado
    const g = svg.append("g")
      .attr("class", "git-graph-container")
      .attr("transform", `translate(${width / 2}, ${height / 2})`); // Centered
    
    // Añadir zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // 1. Calcular profundidad para X
    const nodeById = new Map<string, D3Node>();
    nodes.forEach(node => nodeById.set(node.id, node));
    const nodeDepth = new Map<string, number>();
    function assignDepths(commitId: string, depth: number) {
      if (nodeDepth.has(commitId) && nodeDepth.get(commitId)! >= depth) {
        return; // Avoid cycles and redundant work, take max depth
      }
      nodeDepth.set(commitId, depth);
      const node = nodes.find(n => n.id === commitId);
      if (node && node.commit.parent) {
        assignDepths(node.commit.parent, depth + 1);
      }
      if (node && node.commit.secondParent) {
        assignDepths(node.commit.secondParent, depth + 1);
      }
    }
    gitState.branches.forEach(branch => assignDepths(branch.head, 0));
    nodes.forEach(node => { // Ensure all nodes have a depth
      if (!nodeDepth.has(node.id)) {
         // Find nodes without depth (e.g., initial commit if not pointed to by a branch)
         // This might require a different traversal strategy if initial commits are missed.
         // For now, assume branches cover all relevant history, or assign a default.
         // Let's try assigning max depth found + 1 for orphaned commits
         const maxExistingDepth = nodeDepth.size > 0 ? Math.max(...nodeDepth.values()) : -1;
         assignDepths(node.id, maxExistingDepth + 1); 
      }
    });
    const maxDepth = nodeDepth.size > 0 ? Math.max(...nodeDepth.values()) : 0;
    const nodeSpacing = Math.min(150, (width * 0.8) / (maxDepth + 1));

    // 2. Asignar "Lanes" (Y-coordinates) a Branches
    const branchLanes = new Map<string, number>();
    const ySpacing = 80; // Vertical distance between lanes
    let nextPositiveY = 0;
    let nextNegativeY = 0;
    let mainLaneAssigned = false;

    // Assign main/master to lane 0 first
    const mainBranch = gitState.branches.find(b => b.name === 'main' || b.name === 'master');
    if (mainBranch) {
        branchLanes.set(mainBranch.name, 0);
        mainLaneAssigned = true;
    }

    // Assign other branches, alternating above/below main
    gitState.branches.forEach(branch => {
        if (!branchLanes.has(branch.name)) {
            if (nextPositiveY <= Math.abs(nextNegativeY)) {
                nextPositiveY += ySpacing;
                branchLanes.set(branch.name, nextPositiveY);
            } else {
                nextNegativeY -= ySpacing;
                branchLanes.set(branch.name, nextNegativeY);
            }
        }
    });
    // If main/master didn't exist, shift lanes so the first branch is at 0
    if (!mainLaneAssigned && gitState.branches.length > 0) {
        const firstBranchName = gitState.branches[0].name;
        const firstLaneY = branchLanes.get(firstBranchName) ?? 0;
        if (firstLaneY !== 0) {
             branchLanes.forEach((y, name) => {
                 branchLanes.set(name, y - firstLaneY);
             });
        }
    }

    // 3. Mapear Commits a su Lane Principal
    const commitLaneY = new Map<string, number>(); // Map commit ID to its Y coordinate
    const processedCommits = new Set<string>();

    // Process branches to assign commits to lanes
    // Iterate in a way that gives priority (e.g., main first, then others)
    const sortedBranches = [...gitState.branches].sort((a, b) => {
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        return 0; // Keep original order for others
    });

    sortedBranches.forEach(branch => {
        const branchY = branchLanes.get(branch.name) ?? 0;
        const commitsToVisit = [branch.head];
        const visitedInBranch = new Set<string>();

        while (commitsToVisit.length > 0) {
            const commitId = commitsToVisit.shift()!;
            if (visitedInBranch.has(commitId) || !nodeById.has(commitId)) continue;
            visitedInBranch.add(commitId);

            // Assign Y only if not already assigned by a higher priority branch
            if (!commitLaneY.has(commitId)) {
                commitLaneY.set(commitId, branchY);
            }
            processedCommits.add(commitId); // Mark as processed

            // Add parents to queue
            const node = nodeById.get(commitId)!;
            if (node.commit.parent) commitsToVisit.push(node.commit.parent);
            if (node.commit.secondParent) commitsToVisit.push(node.commit.secondParent);
        }
    });
    
    // 4. Assign Node Positions
    nodes.forEach(node => {
        const depth = nodeDepth.get(node.id) ?? maxDepth; // Fallback depth?
        node.x = -depth * nodeSpacing;
        node.y = commitLaneY.get(node.id) ?? 0; // Fallback to lane 0 if unassigned
    });
    
    // 6. Añadir marcador de flecha - Adjusted RefX
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5) // Position arrowhead tip near the edge
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "arrowhead");
    
    // 7. Crear grupos para los nodos (No change needed here)
    const nodeGroups = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // 8. Círculos de nodos (commits) (No change needed here)
    nodeGroups.append("circle")
      .attr("r", 24)
      .attr("class", d => {
        let classes = "commit-node";
        if (d.commit.highlighted) classes += " highlighted";
        if (d.commit.isHead) classes += " head";
        const branch = gitState.branches.find(b => b.name === d.commit.branch);
        if (branch) {
          return `${classes} branch-${branch.name.replace(/\//g, "-")}`;
        }
        return classes;
      })
      .attr("data-branch", d => d.commit.branch);
    
    // 9. Etiquetas del hash de commit (No change needed here)
    nodeGroups.append("text")
      .attr("y", 40)
      .attr("class", "commit-hash")
      .attr("text-anchor", "middle")
      .text(d => d.commit.id.substring(0, 4) + '..');
    
    // 10. HEAD indicator (Position logic might need check)
    const headCommit = nodes.find(n => n.commit.isHead);

    if (headCommit && headCommit.x !== undefined && headCommit.y !== undefined) {
      // Position HEAD label consistently above the branch label if possible
      const headLabelYOffset = -70;
      g.append("g")
        .attr("transform", `translate(${headCommit.x}, ${headCommit.y + headLabelYOffset})`) // Use commit's actual Y + offset
        .append("rect")
        .attr("width", 80)
        .attr("height", 30)
        .attr("rx", 4)
        .attr("class", "head-indicator")
        .attr("x", -40)
        .attr("y", -15);
      
      g.append("g")
        .attr("transform", `translate(${headCommit.x}, ${headCommit.y + headLabelYOffset})`)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("class", "head-text")
        .text("HEAD");
    }
    
    // 11. Branch labels (Position logic checks)
    gitState.branches.forEach(branch => {
      const branchHeadNode = nodeById.get(branch.head);
      const branchLaneY = branchLanes.get(branch.name);

      if (branchHeadNode && branchHeadNode.x !== undefined && branchHeadNode.y !== undefined && branchLaneY !== undefined) {
        // Ensure branch label Y matches the branch's assigned lane Y
        const branchLabelYOffset = -40; // Position above the commit circle
        const branchLabelG = g.append("g")
          .attr("transform", `translate(${branchHeadNode.x}, ${branchHeadNode.y + branchLabelYOffset})`); // Use commit's actual Y + offset
        
        const textWidth = branch.name.length * 8 + 10; // Estimate width based on text
        branchLabelG.append("rect")
          .attr("width", textWidth)
          .attr("height", 30)
          .attr("rx", 4)
          .attr("class", `branch-box branch-${branch.name}`)
          .attr("x", -textWidth / 2)
          .attr("y", -15);
        
        branchLabelG.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("class", "branch-name")
          .text(branch.name);
      }
    });

    // Limpieza
    return () => {};
  }, [gitState]);

  // Ajustar el tamaño del grafo cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const { width, height } = updateGraphDimensions();
      
      if (graphRef.current) {
        d3.select(graphRef.current)
          .attr("width", width)
          .attr("height", height);
         // Re-center or adjust viewbox on resize?
         // Might need to update the main group transform if width/height changes significantly
         // d3.select(graphRef.current).select(".git-graph-container")
         //    .attr("transform", `translate(${width / 2}, ${height / 2})`);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="git-graph">
      <svg ref={graphRef} className="git-svg"></svg>
    </div>
  );
};

export default GitGraph;