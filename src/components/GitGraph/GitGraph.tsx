import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GitState, D3Node, D3Link } from '../../types/git';
import './GitGraph.css';

interface GitGraphProps {
  gitState: GitState;
}

const GitGraph: React.FC<GitGraphProps> = ({ gitState }) => {
  const graphRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  // Dimensiones del SVG y configuración del grafo
  const updateGraphDimensions = () => {
    if (!graphRef.current) return { width: 600, height: 400 };
    
    const container = graphRef.current.parentElement;
    if (!container) return { width: 600, height: 400 };
    
    return {
      width: container.clientWidth,
      height: container.clientHeight
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
      x: commit.x,
      y: commit.y
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
    
    // Calcular la estructura de las ramas para posicionamiento más lineal
    const branchStructure: Record<string, string[]> = {};
    
    // Agrupar commits por rama
    gitState.branches.forEach(branch => {
      branchStructure[branch.name] = [];
    });
    
    gitState.commits.forEach(commit => {
      if (branchStructure[commit.branch]) {
        branchStructure[commit.branch].push(commit.id);
      }
    });
    
    // Configuración de la simulación de fuerzas D3 con ajustes para visualización más lineal
    const simulation = d3.forceSimulation<D3Node, D3Link>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(100)
        .strength(1)) // Mayor fuerza para los enlaces para mantener la linealidad
      .force("charge", d3.forceManyBody().strength(-300)) // Reducido para menos dispersión
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      // Fuerza personalizada para alinear commits de la misma rama verticalmente
      .force("branch-alignment", alpha => {
        // Aplicar fuerza para alinear commits de la misma rama
        nodes.forEach(node => {
          const branchNodes = nodes.filter(n => n.commit.branch === node.commit.branch);
          if (branchNodes.length > 1) {
            const avgX = d3.mean(branchNodes, d => d.x) || 0;
            node.vx = (node.vx || 0) + (avgX - (node.x || 0)) * alpha * 0.3;
          }
        });
      });
    
    // Crear elementos SVG
    const svg = d3.select(graphRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    
    // Crear contenedor con zoom
    const g = svg.append("g");
    
    // Añadir zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Crear enlaces (líneas)
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("class", d => d.isMerge ? "merge-link" : "link");
    
    // Crear grupos para los nodos
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node-group")
      .call(d3.drag<SVGGElement, D3Node>()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));
    
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
    
    // Actualización de posición durante la simulación
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3Node).x || 0)
        .attr("y1", d => (d.source as D3Node).y || 0)
        .attr("x2", d => (d.target as D3Node).x || 0)
        .attr("y2", d => (d.target as D3Node).y || 0);
      
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    // Guardar referencia a la simulación
    simulationRef.current = simulation;

    function dragStarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragEnded(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Limpieza
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [gitState]);

  // Ajustar el tamaño del grafo cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const { width, height } = updateGraphDimensions();
      
      if (graphRef.current) {
        d3.select(graphRef.current)
          .attr("width", width)
          .attr("height", height);
          
        if (simulationRef.current) {
          simulationRef.current
            .force("center", d3.forceCenter(width / 2, height / 2))
            .alpha(0.3)
            .restart();
        }
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