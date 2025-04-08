import React, { useState, useEffect, useRef } from 'react';
import './GitVisualizer.css';

// Tipos para nuestras estructuras de datos
type CommitNode = {
  id: string;
  message: string;
  branch: string;
  x: number;
  y: number;
  parent?: string;
  highlighted?: boolean;
  isHead?: boolean;
  isLatest?: boolean;
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

// Componente para la visualización de Git
const GitVisualizer: React.FC = () => {
  const [command, setCommand] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [animating, setAnimating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Estado inicial de Git
  const [gitState, setGitState] = useState<GitState>({
    commits: [
      { id: 'c1', message: 'Initial commit', branch: 'main', x: 50, y: 100, isHead: true, isLatest: true }
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
    { name: 'git status', desc: 'Muestra el estado del repositorio' }
  ];

  // Efecto para animar y renderizar cambios
  useEffect(() => {
    drawGitGraph();
  }, [gitState]);

  // Función para dibujar el grafo de Git
  const drawGitGraph = () => {
    if (!canvasRef.current) return;
    // La renderización real ocurre a través de CSS y elementos DOM
  };

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
          handleCommit(args.slice(1));
          break;
        case 'branch':
          handleBranch(args.slice(1));
          break;
        case 'checkout':
          handleCheckout(args.slice(1));
          break;
        case 'merge':
          handleMerge(args.slice(1));
          break;
        case 'rebase':
          handleRebase(args.slice(1));
          break;
        case 'reset':
          handleReset(args.slice(1));
          break;
        case 'status':
          handleStatus();
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
        { id: 'c1', message: 'Initial commit', branch: 'main', x: 50, y: 100, isHead: true, isLatest: true }
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
      x: lastCommit.x + 100,
      y: lastCommit.y,
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
      const branches = gitState.branches.map(b => 
        b.name === gitState.currentBranch ? `* ${b.name}` : `  ${b.name}`
      ).join('\n');
      
      setExplanation(`Muestra las ramas existentes:\n${branches}`);
      return;
    }
    
    // Crear nueva rama
    const newBranchName = args[0];
    
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
    
    // Crear nueva rama
    setGitState({
      ...gitState,
      branches: [
        ...gitState.branches,
        { name: newBranchName, color, head: currentCommit.id }
      ]
    });
    
    setExplanation(`Crea una nueva rama '${newBranchName}' que apunta al commit actual.`);
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
      x: targetCommit.x + 100,
      y: targetCommit.y,
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
      x: baseCommit.x + 100,
      y: baseCommit.y,
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
          <div className="git-graph" ref={canvasRef}>
            {/* Renderizar commits */}
            {gitState.commits.map(commit => (
              <div 
                key={commit.id} 
                className={`commit-node ${commit.isHead ? 'head-commit' : ''} ${commit.highlighted ? 'highlighted' : ''}`}
                style={{
                  left: `${commit.x}px`,
                  top: `${commit.y}px`,
                  borderColor: gitState.branches.find(b => b.name === commit.branch)?.color || '#333'
                }}
                title={`${commit.id}: ${commit.message}`}
              >
                <div className="commit-id">{commit.id}</div>
                
                {/* Líneas entre commits */}
                {commit.parent && (
                  <div className="commit-line" style={{
                    width: '100px',
                    left: '-100px',
                    borderColor: gitState.branches.find(b => b.name === commit.branch)?.color || '#333'
                  }}></div>
                )}
                
                {/* Líneas de merge */}
                {commit.secondParent && (
                  <div className="merge-line" style={{
                    borderColor: gitState.branches.find(b => 
                      b.head === commit.secondParent
                    )?.color || '#333'
                  }}></div>
                )}
              </div>
            ))}
            
            {/* Etiquetas de ramas */}
            {gitState.branches.map(branch => {
              const headCommit = gitState.commits.find(c => c.id === branch.head);
              if (!headCommit) return null;
              
              return (
                <div 
                  key={branch.name}
                  className={`branch-label ${branch.name === gitState.currentBranch ? 'current-branch' : ''}`}
                  style={{
                    left: `${headCommit.x + 20}px`,
                    top: `${headCommit.y - 25}px`,
                    backgroundColor: branch.color
                  }}
                >
                  {branch.name}
                </div>
              );
            })}
          </div>
          
          {/* Estado del repositorio */}
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