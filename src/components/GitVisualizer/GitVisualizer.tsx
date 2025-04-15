import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './GitVisualizer.css';

// Tipos para nuestras estructuras de datos
type CommitNode = {
  id: string;
  message: string;
  branch: string;
  parent?: string;
  secondParent?: string;
  highlighted?: boolean;
  isHead?: boolean;
  isLatest?: boolean;
  // D3 utilizará estas propiedades para posicionamiento
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type Branch = {
  name: string;
  color: string;
  head: string;
};

type GitState = {
  commits: CommitNode[];
  branches: Branch[];
  currentBranch: string;
  stage: string[];
  workingDirectory: string[];
};

// Nodo del grafo D3
interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  commit: CommitNode;
}

// Enlace del grafo D3
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  isMerge?: boolean;
}

// Componente para la visualización de Git
const GitVisualizer: React.FC = () => {
  const [command, setCommand] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [animating, setAnimating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const graphRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  
  // Estado inicial de Git
  const [gitState, setGitState] = useState<GitState>({
    commits: [
      { id: 'c1', message: 'Initial commit', branch: 'main', isHead: true, isLatest: true }
    ],
    branches: [
      { name: 'main', color: '#2ecc71', head: 'c1' }
    ],
    currentBranch: 'main',
    stage: [],
    workingDirectory: []
  });

  // Comandos soportados
  const supportedCommands = [
    { name: 'git init', desc: 'Inicializa un nuevo repositorio Git' },
    { name: 'git add', desc: 'Añade cambios al área de preparación' },
    { name: 'git commit', desc: 'Guarda los cambios en el repositorio' },
    { name: 'git branch', desc: 'Crea o lista ramas' },
    { name: 'git checkout', desc: 'Cambia entre ramas o commits' },
    { name: 'git merge', desc: 'Combina cambios de una rama a otra' },
    { name: 'git rebase', desc: 'Reorganiza commits para una historia lineal' },
    { name: 'git reset', desc: 'Deshace cambios o commits' },
    { name: 'git status', desc: 'Muestra el estado del repositorio' },
    { name: 'git log', desc: 'Muestra el historial de commits' },
    { name: 'git diff', desc: 'Muestra diferencias entre commits' },
    { name: 'git fetch', desc: 'Descarga objetos y referencias de otro repositorio' },
    { name: 'git pull', desc: 'Incorpora cambios de un repositorio remoto' },
    { name: 'git push', desc: 'Actualiza referencias remotas' },
    { name: 'git stash', desc: 'Guarda cambios locales en un área temporal' },
    { name: 'git tag', desc: 'Crea, lista o elimina tags de referencia' },
    { name: 'git cherry-pick', desc: 'Aplica los cambios de commits específicos' }
  ];

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
      .enter()
      .append("path")
      .attr("class", d => d.isMerge ? "link merge-link" : "link")
      .attr("stroke", d => {
        const targetCommit = gitState.commits.find(c => c.id === (typeof d.target === 'string' ? d.target : d.target.id));
        if (!targetCommit) return "#333";
        return gitState.branches.find(b => b.name === targetCommit.branch)?.color || "#333";
      })
      .attr("stroke-width", 2)
      .attr("fill", "none");
    
    // Crear nodos (commits)
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .call(d3.drag<SVGGElement, D3Node>()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));
    
    // Añadir círculos para cada commit
    node.append("circle")
      .attr("class", d => `commit-node ${d.commit.isHead ? "head-commit" : ""} ${d.commit.highlighted ? "highlighted" : ""}`)
      .attr("r", 20)
      .attr("stroke", d => {
        return gitState.branches.find(b => b.name === d.commit.branch)?.color || "#333";
      })
      .attr("stroke-width", 3);
    
    // Añadir texto para el ID del commit
    node.append("text")
      .attr("class", "commit-id")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => d.commit.id);
    
    // Añadir tooltip con mensaje al hacer hover
    node.append("title")
      .text(d => `${d.commit.id}: ${d.commit.message}`);
    
    // Añadir etiquetas de rama con animación mejorada
    const branchLabels = g.append("g")
      .attr("class", "branch-labels")
      .selectAll("g")
      .data(gitState.branches)
      .enter()
      .append("g")
      .attr("class", "branch-group");
    
    branchLabels.append("rect")
      .attr("class", d => `branch-label ${d.name === gitState.currentBranch ? "current-branch" : ""}`)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", d => d.color)
      .attr("height", 22);
    
    branchLabels.append("text")
      .attr("class", "branch-name")
      .attr("dy", "0.85em")
      .attr("dx", "8")
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .text(d => d.name);
    
    // Calcular ancho de cada etiqueta
    branchLabels.each(function() {
      const text = d3.select(this).select("text");
      const textNode = text.node() as SVGTextElement;
      const textWidth = textNode?.getComputedTextLength() || 0;
      d3.select(this).select("rect").attr("width", textWidth + 16);
    });

    // Actualizar posiciones en cada tick de la simulación  
    simulation.on("tick", () => {
      // Aplicar posicionamiento lineal vertical para commits de la misma rama
      const branches = Object.keys(branchStructure);
      
      branches.forEach((branchName, branchIndex) => {
        const branchCommits = branchStructure[branchName];
        const branchNode = nodes.find(n => n.commit.branch === branchName);
        
        if (branchNode && branchNode.x) {
          // Calcular posición X para la rama (espaciado horizontal entre ramas)
          const branchX = width * 0.2 + (branchIndex * (width * 0.6 / branches.length));
          
          // Asignar posición X a todos los commits de esta rama
          branchCommits.forEach((commitId, index) => {
            const node = nodes.find(n => n.id === commitId);
            if (node) {
              // Impulsar hacia la posición X de esta rama
              node.vx = (node.vx || 0) + (branchX - (node.x || 0)) * 0.1;
              
              // Aplicar una fuerza para que los commits más recientes estén más arriba
              const commitY = height * 0.8 - (index * 80);
              node.vy = (node.vy || 0) + (commitY - (node.y || 0)) * 0.1;
            }
          });
        }
      });
      
      // Actualizar posición de enlaces con curvas mejoradas
      link.attr("d", d => {
        const source = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
        const target = typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target;
        
        if (!source || !target || !source.x || !source.y || !target.x || !target.y) return "";
        
        if (d.isMerge) {
          // Curva para enlaces de merge más pronunciada y clara
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 - 50;
          return `M${source.x},${source.y} Q${midX},${midY} ${target.x},${target.y}`;
        } else {
          // Para commits de la misma rama, curva suave para visualización más elegante
          const sourceCommit = gitState.commits.find(c => c.id === (typeof d.source === 'string' ? d.source : d.source.id));
          const targetCommit = gitState.commits.find(c => c.id === (typeof d.target === 'string' ? d.target : d.target.id));
          
          if (sourceCommit && targetCommit && sourceCommit.branch === targetCommit.branch) {
            // Línea más directa para commits en la misma rama
            return `M${source.x},${source.y} L${target.x},${target.y}`;
          } else {
            // Curva para ramas diferentes
            const controlX = (source.x + target.x) / 2;
            const controlY = (source.y + target.y) / 2 + 30;
            return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
          }
        }
      });
      
      // Actualizar posición de nodos
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Actualizar posición de etiquetas de rama
      branchLabels.attr("transform", d => {
        const headCommit = nodes.find(n => n.id === d.head);
        if (!headCommit || !headCommit.x || !headCommit.y) return "";
        return `translate(${headCommit.x + 30},${headCommit.y - 30})`;
      });
    });
    
    // Funciones de arrastre
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
      
      // Opcional: desactivar para permitir nodos fijos
      // event.subject.fx = null;
      // event.subject.fy = null;
    }
    
    // Referencia a la simulación
    simulationRef.current = simulation;
    
    // Iniciar simulación con transición suave
    simulation.alpha(1).restart();
    
    // Limpieza
    return () => {
      simulation.stop();
    };
  }, [gitState]);

  // Ajuste automático del tamaño del gráfico al cambiar el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (!graphRef.current || !simulationRef.current) return;
      
      const { width, height } = updateGraphDimensions();
      
      d3.select(graphRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height);
      
      simulationRef.current
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .alpha(0.3)
        .restart();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Manejador del comando ingresado
  const handleCommand = () => {
    if (!command.trim()) return;
    
    setHistory([...history, command]);
    setError('');
    
    // Separar el comando y sus argumentos
    const [cmd, ...args] = command.trim().split(' ');
    
    // Procesar comando
    switch (cmd.toLowerCase()) {
      case 'git':
        processGitCommand(args);
        break;
      case 'clear':
        setHistory([]);
        break;
      default:
        setError(`Comando no reconocido: ${cmd}`);
    }
    
    setCommand('');
  };

  // Procesar comandos Git
  const processGitCommand = (args: string[]) => {
    if (!args.length) {
      setError('Comando Git incompleto');
      return;
    }

    const subCommand = args[0].toLowerCase();
    
    // Iniciar animación
    setAnimating(true);
    
    setTimeout(() => {
      // Aquí procesamos cada subcomando
      switch (subCommand) {
        case 'init':
          handleInit();
          break;
        case 'add':
          handleAdd(args.slice(1));
          break;
        case 'commit':
        case 'ci': // Alias común para commit
        case 'cmt':
          handleCommit(args.slice(1));
          break;
        case 'branch':
        case 'br': // Alias común para branch
          handleBranch(args.slice(1));
          break;
        case 'checkout':
        case 'co': // Alias común para checkout
        case 'switch': // Git switch es equivalente a checkout para cambiar ramas
          handleCheckout(args.slice(1));
          break;
        case 'merge':
        case 'mg': // Alias para merge
          handleMerge(args.slice(1));
          break;
        case 'rebase':
        case 'rb': // Alias para rebase
          handleRebase(args.slice(1));
          break;
        case 'reset':
        case 'rs': // Alias para reset
          handleReset(args.slice(1));
          break;
        case 'status':
        case 'st': // Alias común para status
          handleStatus();
          break;
        case 'log':
          handleLog(args.slice(1));
          break;
        case 'diff':
          handleDiff(args.slice(1));
          break;
        case 'fetch':
          handleFetch(args.slice(1));
          break;
        case 'pull':
          handlePull(args.slice(1));
          break;
        case 'push':
          handlePush(args.slice(1));
          break;
        case 'stash':
          handleStash(args.slice(1));
          break;
        case 'tag':
          handleTag(args.slice(1));
          break;
        case 'cherry-pick':
        case 'cp':
          handleCherryPick(args.slice(1));
          break;
        default:
          setError(`Subcomando Git no soportado: ${subCommand}`);
      }
      
      setAnimating(false);
    }, 300); // Retraso para la animación
  };

  // Implementaciones de comandos Git
  const handleInit = () => {
    // Reiniciar el estado Git
    setGitState({
      commits: [
        { id: 'c1', message: 'Initial commit', branch: 'main', isHead: true, isLatest: true }
      ],
      branches: [
        { name: 'main', color: '#2ecc71', head: 'c1' }
      ],
      currentBranch: 'main',
      stage: [],
      workingDirectory: []
    });
    setExplanation('Inicializa un nuevo repositorio Git con una rama main y un commit inicial.');
  };

  const handleAdd = (args: string[]) => {
    // Simular añadiendo archivos al área de preparación
    const filesToAdd = args.length ? args : ['.'];
    
    const newStage = [...gitState.stage];
    
    if (filesToAdd.includes('.')) {
      // Add all files (simulated)
      newStage.push('all-files');
    } else {
      // Add specific files
      filesToAdd.forEach(file => {
        if (!newStage.includes(file)) {
          newStage.push(file);
        }
      });
    }
    
    setGitState({
      ...gitState,
      stage: newStage
    });
    
    setExplanation('Añade cambios del directorio de trabajo al área de preparación (staging area).');
  };

  const handleCommit = (args: string[]) => {
    if (!gitState.stage.length) {
      setError('No hay cambios preparados para hacer commit');
      return;
    }
    
    // Extraer mensaje de commit
    let message = 'New commit';
    if (args.includes('-m')) {
      const msgIndex = args.indexOf('-m') + 1;
      if (msgIndex < args.length) {
        message = args[msgIndex].replace(/['"]/g, '');
      }
    }
    
    // Crear nuevo commit
    const lastCommit = gitState.commits.find(c => c.isHead);
    if (!lastCommit) return;
    
    const newCommitId = `c${gitState.commits.length + 1}`;
    const branch = gitState.currentBranch;
    
    // Actualizar commits y rama actual
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: c.branch === branch ? false : c.isLatest
    }));
    
    updatedCommits.push({
      id: newCommitId,
      message,
      branch,
      parent: lastCommit.id,
      isHead: true,
      isLatest: true
    });
    
    // Actualizar cabeza de la rama
    const updatedBranches = gitState.branches.map(b => 
      b.name === branch ? { ...b, head: newCommitId } : b
    );
    
    setGitState({
      ...gitState,
      commits: updatedCommits,
      branches: updatedBranches,
      stage: [] // Limpiar el área de preparación
    });
    
    setExplanation('Guarda los cambios preparados en un nuevo commit en la rama actual.');
  };

  const handleBranch = (args: string[]) => {
    if (!args.length) {
      // Listar ramas
      const branchList = gitState.branches.map(b => 
        `${b.name === gitState.currentBranch ? '* ' : '  '}${b.name}`
      ).join('\n');
      setExplanation(`Ramas en el repositorio:\n${branchList}`);
      return;
    }

    // Verificar opciones
    let branchName = args[0];
    let startPoint: string | null = null;
    
    // Opciones como -d, -D (eliminar), -m (mover/renombrar), etc.
    if (branchName.startsWith('-')) {
      const option = branchName;
      
      if (['-d', '-D', '--delete'].includes(option) && args.length > 1) {
        // Eliminar rama
        branchName = args[1];
        
        if (branchName === gitState.currentBranch) {
          setError(`No se puede eliminar la rama activa: ${branchName}`);
          return;
        }
        
        if (!gitState.branches.some(b => b.name === branchName)) {
          setError(`La rama ${branchName} no existe`);
          return;
        }
        
        // Verificar si la rama está totalmente fusionada (simulado)
        if (option === '-d') {
          // Simulamos que la rama está fusionada
          const isMerged = true; // En una implementación real, esto sería una verificación
          
          if (!isMerged) {
            setError(`La rama ${branchName} no está totalmente fusionada`);
            return;
          }
        }
        
        // Eliminar la rama
        const updatedBranches = gitState.branches.filter(b => b.name !== branchName);
        
        setGitState({
          ...gitState,
          branches: updatedBranches
        });
        
        setExplanation(`La rama ${branchName} ha sido eliminada.`);
        return;
      }
      
      if (['-m', '--move', '-c', '--copy'].includes(option) && args.length > 1) {
        // Renombrar o copiar rama
        const newName = args[1];
        const sourceRama = args.length > 2 ? args[2] : gitState.currentBranch;
        
        if (gitState.branches.some(b => b.name === newName)) {
          setError(`La rama ${newName} ya existe`);
          return;
        }
        
        const sourceBranch = gitState.branches.find(b => b.name === sourceRama);
        if (!sourceBranch) {
          setError(`La rama ${sourceRama} no existe`);
          return;
        }
        
        if (['-m', '--move'].includes(option)) {
          // Renombrar rama
          const updatedBranches = gitState.branches.map(b => 
            b.name === sourceRama ? { ...b, name: newName } : b
          );
          
          // Actualizar la rama actual si estamos renombrando la rama activa
          const newCurrentBranch = sourceRama === gitState.currentBranch ? newName : gitState.currentBranch;
          
          // Actualizar la propiedad branch de los commits
          const updatedCommits = gitState.commits.map(c => 
            c.branch === sourceRama ? { ...c, branch: newName } : c
          );
          
          setGitState({
            ...gitState,
            branches: updatedBranches,
            currentBranch: newCurrentBranch,
            commits: updatedCommits
          });
          
          setExplanation(`Rama ${sourceRama} renombrada a ${newName}.`);
        } else {
          // Copiar rama
          const newBranch = { ...sourceBranch, name: newName };
          
          setGitState({
            ...gitState,
            branches: [...gitState.branches, newBranch]
          });
          
          setExplanation(`Rama ${sourceRama} copiada a ${newName}.`);
        }
        
        return;
      }
      
      // Otras opciones como -a (todas), -r (remotas), etc.
      setExplanation(`Opción ${option} no implementada en esta simulación.`);
      return;
    }
    
    // Buscar argumento de punto de inicio (startpoint)
    if (args.length > 1) {
      startPoint = args[1];
      
      // Verificar si el punto de inicio existe
      const startCommit = gitState.commits.find(c => c.id === startPoint);
      if (!startCommit) {
        setError(`El commit ${startPoint} no existe`);
        return;
      }
    }
    
    // Verificar si la rama ya existe
    if (gitState.branches.some(b => b.name === branchName)) {
      setError(`La rama ${branchName} ya existe`);
      return;
    }
    
    // Obtener commit actual (HEAD) si no se especificó un punto de inicio
    const headCommit = gitState.commits.find(c => c.isHead);
    if (!headCommit && !startPoint) {
      setError('No hay commits en el repositorio');
      return;
    }
    
    const startCommitId = startPoint || headCommit?.id || '';
    
    // Obtener color para la nueva rama
    const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];
    const usedColors = gitState.branches.map(b => b.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    const branchColor = availableColors.length ? availableColors[0] : colors[Math.floor(Math.random() * colors.length)];
    
    // Crear la nueva rama
    const newBranch = {
      name: branchName,
      color: branchColor,
      head: startCommitId
    };
    
    // Destacar temporalmente el commit de inicio para la animación
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      highlighted: c.id === startCommitId
    }));
    
    // Actualizar el estado con la nueva rama y commits destacados
    setGitState({
      ...gitState,
      branches: [...gitState.branches, newBranch],
      commits: updatedCommits
    });
    
    // Mostrar animación de creación de rama
    setTimeout(() => {
      // Quitar el resaltado después de la animación
      const finalCommits = gitState.commits.map(c => ({
        ...c,
        highlighted: false
      }));
      
      setGitState(prevState => ({
        ...prevState,
        commits: finalCommits
      }));
    }, 1500);
    
    setExplanation(`Nueva rama '${branchName}' creada, apuntando a ${startCommitId}.`);
  };

  const handleCheckout = (args: string[]) => {
    if (!args.length) {
      setError('Se requiere especificar una rama o commit');
      return;
    }
    
    const target = args[0];
    
    // Verificar si es una rama existente
    const targetBranch = gitState.branches.find(b => b.name === target);
    
    if (targetBranch) {
      // Cambiar a la rama especificada
      const branchHeadCommit = gitState.commits.find(c => c.id === targetBranch.head);
      if (!branchHeadCommit) return;
      
      // Actualizar commits
      const updatedCommits = gitState.commits.map(c => ({
        ...c,
        isHead: c.id === branchHeadCommit.id,
        highlighted: false
      }));
      
      setGitState({
        ...gitState,
        commits: updatedCommits,
        currentBranch: targetBranch.name
      });
      
      setExplanation(`Cambia a la rama '${targetBranch.name}'.`);
      return;
    }
    
    // Verificar si es un commit
    const targetCommit = gitState.commits.find(c => c.id === target || c.id.startsWith(target));
    
    if (targetCommit) {
      // Cambiar a un estado de "HEAD desconectada"
      const updatedCommits = gitState.commits.map(c => ({
        ...c,
        isHead: c.id === targetCommit.id,
        highlighted: false
      }));
      
      setGitState({
        ...gitState,
        commits: updatedCommits,
        currentBranch: 'HEAD detached'
      });
      
      setExplanation(`Cambia al commit ${targetCommit.id}. Estás ahora en un estado 'HEAD detached'.`);
      return;
    }
    
    // Crear nueva rama con -b
    if (args[0] === '-b' && args.length > 1) {
      const newBranchName = args[1];
      
      // Verificar si ya existe
      if (gitState.branches.some(b => b.name === newBranchName)) {
        setError(`La rama '${newBranchName}' ya existe`);
        return;
      }
      
      // Obtener commit actual
      const currentCommit = gitState.commits.find(c => c.isHead);
      if (!currentCommit) return;
      
      // Generar color aleatorio para la rama
      const colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22'];
      const usedColors = gitState.branches.map(b => b.color);
      const availableColors = colors.filter(c => !usedColors.includes(c));
      const color = availableColors.length ? 
        availableColors[Math.floor(Math.random() * availableColors.length)] : 
        `#${Math.floor(Math.random()*16777215).toString(16)}`;
      
      // Crear nueva rama y cambiar a ella
      setGitState({
        ...gitState,
        branches: [
          ...gitState.branches,
          { name: newBranchName, color, head: currentCommit.id }
        ],
        currentBranch: newBranchName
      });
      
      setExplanation(`Crea y cambia a la nueva rama '${newBranchName}'.`);
      return;
    }
    
    setError(`No se encontró la rama o commit '${target}'`);
  };

  const handleMerge = (args: string[]) => {
    if (!args.length) {
      setError('Se requiere especificar una rama para fusionar');
      return;
    }
    
    const sourceBranchName = args[0];
    const targetBranchName = gitState.currentBranch;
    
    // Verificar si la rama fuente existe
    const sourceBranch = gitState.branches.find(b => b.name === sourceBranchName);
    if (!sourceBranch) {
      setError(`La rama '${sourceBranchName}' no existe`);
      return;
    }
    
    // Verificar si es la misma rama
    if (sourceBranchName === targetBranchName) {
      setError('No se puede fusionar una rama consigo misma');
      return;
    }
    
    // Obtener commits de cabeza
    const sourceCommit = gitState.commits.find(c => c.id === sourceBranch.head);
    const targetCommit = gitState.commits.find(c => c.isHead);
    
    if (!sourceCommit || !targetCommit) return;
    
    // Crear commit de fusión
    const mergeCommitId = `c${gitState.commits.length + 1}`;
    
    // Actualizar commits
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: c.branch === targetBranchName ? false : c.isLatest
    }));
    
    updatedCommits.push({
      id: mergeCommitId,
      message: `Merge ${sourceBranchName} into ${targetBranchName}`,
      branch: targetBranchName,
      parent: targetCommit.id,
      secondParent: sourceCommit.id,
      isHead: true,
      isLatest: true
    });
    
    // Actualizar cabeza de la rama destino
    const updatedBranches = gitState.branches.map(b => 
      b.name === targetBranchName ? { ...b, head: mergeCommitId } : b
    );
    
    setGitState({
      ...gitState,
      commits: updatedCommits,
      branches: updatedBranches
    });
    
    setExplanation(`Fusiona la rama '${sourceBranchName}' en la rama actual '${targetBranchName}'.`);
  };

  const handleRebase = (args: string[]) => {
    if (!args.length) {
      setError('Se requiere especificar una rama base para el rebase');
      return;
    }
    
    const baseBranchName = args[0];
    const currentBranchName = gitState.currentBranch;
    
    // Verificar si la rama base existe
    const baseBranch = gitState.branches.find(b => b.name === baseBranchName);
    if (!baseBranch) {
      setError(`La rama '${baseBranchName}' no existe`);
      return;
    }
    
    // Verificar si es la misma rama
    if (baseBranchName === currentBranchName) {
      setError('No se puede hacer rebase sobre la misma rama');
      return;
    }
    
    // Obtener commits
    const baseCommit = gitState.commits.find(c => c.id === baseBranch.head);
    const currentCommit = gitState.commits.find(c => c.isHead);
    
    if (!baseCommit || !currentCommit) return;
    
    // Simular rebase creando un nuevo commit
    const rebaseCommitId = `c${gitState.commits.length + 1}`;
    
    // Actualizar commits
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: c.branch === currentBranchName ? false : c.isLatest
    }));
    
    updatedCommits.push({
      id: rebaseCommitId,
      message: `${currentCommit.message} (rebased)`,
      branch: currentBranchName,
      parent: baseCommit.id,
      isHead: true,
      isLatest: true
    });
    
    // Actualizar cabeza de la rama actual
    const updatedBranches = gitState.branches.map(b => 
      b.name === currentBranchName ? { ...b, head: rebaseCommitId } : b
    );
    
    setGitState({
      ...gitState,
      commits: updatedCommits,
      branches: updatedBranches
    });
    
    setExplanation(`Reorganiza la historia de la rama actual '${currentBranchName}' sobre la rama '${baseBranchName}'.`);
  };

  const handleReset = (args: string[]) => {
    if (!args.length) {
      setError('Se requiere especificar un commit o --hard/--soft');
      return;
    }
    
    let isHard = false;
    let targetCommitId = null;
    
    // Procesar opciones
    if (args.includes('--hard')) {
      isHard = true;
      args = args.filter(a => a !== '--hard');
    }
    
    if (args.length > 0) {
      targetCommitId = args[0];
    } else {
      // Reset al último commit
      const parentCommit = gitState.commits.find(c => c.isHead)?.parent;
      if (parentCommit) {
        targetCommitId = parentCommit;
      } else {
        setError('No se puede hacer reset más allá del commit inicial');
        return;
      }
    }
    
    // Buscar commit objetivo
    const targetCommit = gitState.commits.find(c => 
      c.id === targetCommitId || c.id.startsWith(targetCommitId)
    );
    
    if (!targetCommit) {
      setError(`No se encontró el commit '${targetCommitId}'`);
      return;
    }
    
    // Actualizar commits y rama actual
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: c.id === targetCommit.id,
      highlighted: false
    }));
    
    // Actualizar cabeza de la rama actual
    const updatedBranches = gitState.branches.map(b => 
      b.name === gitState.currentBranch ? { ...b, head: targetCommit.id } : b
    );
    
    setGitState({
      ...gitState,
      commits: updatedCommits,
      branches: updatedBranches,
      stage: isHard ? [] : gitState.stage,
      workingDirectory: isHard ? [] : gitState.workingDirectory
    });
    
    setExplanation(`Reset ${isHard ? 'duro' : 'suave'} al commit ${targetCommit.id}. ${
      isHard ? 'Descarta todos los cambios.' : 'Mantiene los cambios en el directorio de trabajo.'
    }`);
  };

  const handleStatus = () => {
    const stagedFiles = gitState.stage.length ? 
      gitState.stage.join(', ') : 'No hay cambios preparados';
    
    const workingDirFiles = gitState.workingDirectory.length ? 
      gitState.workingDirectory.join(', ') : 'No hay cambios sin preparar';
    
    setExplanation(`Estado del repositorio:
      Rama actual: ${gitState.currentBranch}
      Cambios preparados: ${stagedFiles}
      Cambios sin preparar: ${workingDirFiles}`);
  };

  // Funciones auxiliares para renderizado
  const getCommandSuggestions = () => {
    if (!command.startsWith('git ')) return [];
    
    const gitCmd = command.substring(4).toLowerCase();
    return supportedCommands
      .filter(cmd => cmd.name.substring(4).startsWith(gitCmd))
      .map(cmd => cmd.name);
  };

  const suggestions = getCommandSuggestions();

  // Nuevos manejadores para comandos Git adicionales
  const handleLog = (args: string[]) => {
    // Simular comando git log
    const logEntries = gitState.commits
      .slice()
      .reverse()
      .map(commit => {
        const branch = gitState.branches.find(b => b.name === commit.branch);
        return `commit ${commit.id}${commit.isHead ? ' (HEAD)' : ''}\nAuthor: Usuario\nDate: ${new Date().toISOString()}\n\n    ${commit.message}\n`;
      })
      .join('\n');
    
    setExplanation(`Git Log:\n${logEntries}`);
  };

  const handleDiff = (args: string[]) => {
    // Simulación simple de git diff
    setExplanation('Comando git diff: Muestra las diferencias entre commits, el directorio de trabajo y el índice.');
  };

  const handleFetch = (args: string[]) => {
    // Simulación simple de git fetch
    setExplanation('Comando git fetch: Descarga objetos y referencias de otro repositorio.');
  };

  const handlePull = (args: string[]) => {
    // Simulación simple de git pull
    setExplanation('Comando git pull: Incorpora cambios de un repositorio remoto en la rama actual.');
  };

  const handlePush = (args: string[]) => {
    // Simulación simple de git push
    setExplanation('Comando git push: Actualiza referencias remotas junto con objetos asociados.');
  };

  const handleStash = (args: string[]) => {
    // Simulación simple de git stash
    setExplanation('Comando git stash: Guarda cambios locales en un área temporal.');
  };

  const handleTag = (args: string[]) => {
    // Simulación simple de git tag
    setExplanation('Comando git tag: Crea, lista o elimina tags de referencia.');
  };

  const handleCherryPick = (args: string[]) => {
    // Simulación simple de git cherry-pick
    setExplanation('Comando git cherry-pick: Aplica los cambios introducidos por algunos commits existentes.');
  };

  return (
    <div className="git-visualizer">
      <div className="app-header">
        <h1>Visualizador de Comandos Git</h1>
        <div className="description">
          Escribe comandos Git para ver animaciones y entender cómo funcionan.
        </div>
      </div>
      
      <div className="content-container">
        <div className="visualization-container">
          <div className="git-graph">
            <svg ref={graphRef} className="git-svg"></svg>
          </div>
          
          <div className="repo-state">
            <div className="state-section">
              <h3>Rama actual: <span className="branch-name">{gitState.currentBranch}</span></h3>
            </div>
            <div className="state-section">
              <h3>Área de preparación:</h3>
              <div className="state-content">
                {gitState.stage.length ? (
                  <ul>
                    {gitState.stage.map((file, i) => (
                      <li key={i}>{file}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay cambios preparados</p>
                )}
              </div>
            </div>
            <div className="state-section">
              <h3>Directorio de trabajo:</h3>
              <div className="state-content">
                {gitState.workingDirectory.length ? (
                  <ul>
                    {gitState.workingDirectory.map((file, i) => (
                      <li key={i}>{file}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay cambios sin preparar</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="command-container">
          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-button red"></div>
              <div className="terminal-button yellow"></div>
              <div className="terminal-button green"></div>
              <div className="terminal-title">Git Terminal</div>
            </div>
            <div className="terminal-content">
              {history.map((cmd, i) => (
                <div key={i} className="history-item">
                  <span className="prompt">$</span> {cmd}
                </div>
              ))}
              
              {error && (
                <div className="error-message">
                  Error: {error}
                </div>
              )}
              
              <div className="command-input-container">
                <span className="prompt">$</span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                  placeholder="Escribe un comando Git..."
                  className="command-input"
                  list="git-commands"
                  autoFocus
                />
                <button 
                  className="execute-button"
                  onClick={handleCommand}
                  disabled={animating}
                >
                  Ejecutar
                </button>
              </div>
              
              {suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map((s, i) => (
                    <div 
                      key={i} 
                      className="suggestion-item"
                      onClick={() => setCommand(s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="explanation-panel">
            <h3>Explicación</h3>
            <div className="explanation-content">
              {explanation ? (
                <p>{explanation}</p>
              ) : (
                <p>Escribe un comando Git para ver su explicación.</p>
              )}
            </div>
          </div>
          
          <div className="command-list">
            <h3>Comandos Soportados</h3>
            <div className="commands-grid">
              {supportedCommands.map((cmd, i) => (
                <div 
                  key={i} 
                  className="command-item"
                  onClick={() => setCommand(cmd.name)}
                >
                  <div className="command-name">{cmd.name}</div>
                  <div className="command-desc">{cmd.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitVisualizer;