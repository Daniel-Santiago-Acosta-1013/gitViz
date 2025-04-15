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
      // Dejamos las coordenadas indefinidas, las asignaremos después
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
    
    // Crear contenedor con zoom
    const g = svg.append("g")
      .attr("transform", `translate(${width * 0.1}, ${height / 2})`);
    
    // Añadir zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Calcular posiciones para layout horizontal lineal
    const nodeById = new Map<string, D3Node>();
    nodes.forEach(node => nodeById.set(node.id, node));
    
    // Crear un mapa de profundidad para cada nodo
    const nodeDepth = new Map<string, number>();
    
    // Función para asignar profundidades
    function assignDepths(commitId: string, depth: number) {
      if (nodeDepth.has(commitId)) {
        return;
      }
      
      nodeDepth.set(commitId, depth);
      
      // Asignar profundidades a los padres
      const node = nodes.find(n => n.id === commitId);
      if (node && node.commit.parent) {
        assignDepths(node.commit.parent, depth + 1);
      }
    }
    
    // Encontrar el commit más reciente para cada rama
    gitState.branches.forEach(branch => {
      const headCommitId = branch.head;
      assignDepths(headCommitId, 0);
    });
    
    // Para commits sin profundidad asignada (posible con rebase/merge)
    nodes.forEach(node => {
      if (!nodeDepth.has(node.id)) {
        nodeDepth.set(node.id, 0);
      }
    });
    
    // Ajustar las posiciones de los nodos en base a su profundidad
    const maxDepth = Math.max(...Array.from(nodeDepth.values()));
    const nodeSpacing = Math.min(150, (width * 0.8) / (maxDepth + 1));
    
    // Agrupación de commits por profundidad para manejar múltiples commits con la misma profundidad
    const depthGroups = new Map<number, string[]>();
    
    nodeDepth.forEach((depth, commitId) => {
      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth)?.push(commitId);
    });
    
    // Asignar posiciones en X basadas en profundidad y en Y basadas en índice dentro de la misma profundidad
    depthGroups.forEach((commitIds, depth) => {
      const totalCommitsAtDepth = commitIds.length;
      const ySpacing = 40;  // Espaciado vertical entre commits de la misma profundidad
      
      commitIds.forEach((commitId, index) => {
        const node = nodeById.get(commitId);
        if (node) {
          // Posición X basada en profundidad (desde la derecha hacia la izquierda)
          node.x = width * 0.8 - depth * nodeSpacing;
          
          // Posición Y centrada, con desplazamiento si hay múltiples commits
          const yOffset = totalCommitsAtDepth > 1 
            ? (index - (totalCommitsAtDepth - 1) / 2) * ySpacing 
            : 0;
          node.y = yOffset;
        }
      });
    });
    
    // Crear enlaces antes que los nodos para que queden detrás
    const linkElements = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("class", d => d.isMerge ? "commit-link merge" : "commit-link")
      .attr("d", d => {
        const source = nodeById.get(d.source.toString());
        const target = nodeById.get(d.target.toString());
        
        if (!source || !target || source.x === undefined || source.y === undefined || 
            target.x === undefined || target.y === undefined) {
          return "";
        }
        
        // Draw a curved line from source to target
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Make curve a bit wider
        
        return d.isMerge 
          ? `M${source.x},${source.y}C${source.x-30},${source.y} ${target.x+30},${target.y} ${target.x},${target.y}` 
          : `M${source.x},${source.y}L${target.x},${target.y}`;
      });
    
    // Crear grupos para los nodos
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // Círculos de nodos (commits)
    node.append("circle")
      .attr("r", 10)
      .attr("class", d => {
        let classes = "commit-node";
        if (d.commit.highlighted) classes += " highlighted";
        if (d.commit.isHead) classes += " head";
        // Asignar color según la rama
        const branch = gitState.branches.find(b => b.name === d.commit.branch);
        if (branch) {
          return `${classes} branch-${branch.name.replace(/\//g, "-")}`;
        }
        return classes;
      })
      .attr("data-branch", d => d.commit.branch);
    
    // Etiquetas de commits
    node.append("text")
      .attr("dx", 15)
      .attr("dy", 5)
      .attr("class", "commit-label")
      .text(d => d.commit.id + ": " + d.commit.message.substring(0, 15) + (d.commit.message.length > 15 ? "..." : ""));
    
    // Etiquetas de ramas
    node.append("text")
      .attr("dx", 15)
      .attr("dy", -10)
      .attr("class", "branch-label")
      .text(d => {
        const branch = gitState.branches.find(b => b.head === d.commit.id);
        return branch ? branch.name : "";
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