import React, { useState, useEffect } from 'react';
import { GitState, CommandDefinition } from '../../types/git';
import GitGraph from '../GitGraph/GitGraph';
import RepoState from '../RepoState/RepoState';
import CommandTerminal from '../CommandTerminal/CommandTerminal';
import ExplanationPanel from '../ExplanationPanel/ExplanationPanel';
import CommandList from '../CommandList/CommandList';
import './GitVisualizer.css';

// Componente para la visualización de Git
const GitVisualizer: React.FC = () => {
  const [command, setCommand] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [animating, setAnimating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
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
  const supportedCommands: CommandDefinition[] = [
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

  const handleCommand = () => {
    if (!command.trim()) return;
    
    // Agregar comando a historial
    setHistory(prev => [...prev, command]);
    
    // Limpiar estados de error y sugerencias
    setError('');
    setSuggestions([]);
    
    // Procesar comando
    const parts = command.trim().split(/\s+/);
    
    if (parts[0] === 'git') {
      processGitCommand(parts.slice(1));
    } else {
      setError(`Comando no reconocido. Utiliza "git <comando>" para operaciones Git.`);
    }
    
    // Limpiar campo de comando
    setCommand('');
  };

  const processGitCommand = (args: string[]) => {
    if (!args.length) {
      setSuggestions(supportedCommands.map(cmd => cmd.name));
      setExplanation('Git es un sistema de control de versiones. Usa "git <comando>" para una operación específica.');
      return;
    }
    
    const mainCommand = args[0].toLowerCase();
    
    switch (mainCommand) {
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
        handleCherryPick(args.slice(1));
        break;
      default:
        setError(`Comando git desconocido: ${mainCommand}`);
        setSuggestions(getCommandSuggestions());
    }
  };

  const handleInit = () => {
    // Simulación simple de git init
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
    
    setExplanation('Comando git init: Inicializa un nuevo repositorio Git con una rama principal llamada main.');
  };

  const handleAdd = (args: string[]) => {
    // Simulación simple de git add
    if (args.length === 0) {
      setError('Especifica un archivo para añadir al área de preparación. Ejemplo: git add <archivo>');
      return;
    }
    
    const newStage = [...gitState.stage];
    const newWorkingDir = [...gitState.workingDirectory];
    
    if (args[0] === '.') {
      // Añadir todos los archivos del directorio de trabajo
      if (newWorkingDir.length === 0) {
        setExplanation('No hay cambios para añadir al área de preparación.');
        return;
      }
      
      newStage.push(...newWorkingDir);
      newWorkingDir.length = 0;
    } else {
      // Añadir archivos específicos
      args.forEach(file => {
        if (newWorkingDir.includes(file)) {
          newStage.push(file);
          newWorkingDir.splice(newWorkingDir.indexOf(file), 1);
        } else if (!newStage.includes(file)) {
          // Simular creación de nuevo archivo
          newStage.push(file);
        }
      });
    }
    
    setGitState({
      ...gitState,
      stage: newStage,
      workingDirectory: newWorkingDir
    });
    
    setExplanation(`Comando git add: Añade cambios al área de preparación para el próximo commit.`);
  };

  const handleCommit = (args: string[]) => {
    // Verificar si hay cambios para commit
    if (gitState.stage.length === 0) {
      setError('No hay cambios preparados para commit. Usa "git add <archivo>" primero.');
      return;
    }
    
    // Verificar mensaje de commit
    let message = "Commit sin mensaje";
    if (args.length >= 2 && args[0] === '-m') {
      // Obtener mensaje entre comillas si está presente
      const msgMatch = command.match(/-m\s+["'](.+?)["']/);
      if (msgMatch && msgMatch[1]) {
        message = msgMatch[1];
      } else {
        message = args.slice(1).join(' ');
      }
    }
    
    // Obtener el commit actual (HEAD)
    const headCommitId = gitState.branches.find(b => b.name === gitState.currentBranch)?.head;
    const headCommit = gitState.commits.find(c => c.id === headCommitId);
    
    if (!headCommit) {
      setError('Error interno: No se pudo encontrar el commit HEAD.');
      return;
    }
    
    // Desmarcar el commit anterior como HEAD/latest
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: false
    }));
    
    // Crear nuevo commit
    const newCommitId = `c${gitState.commits.length + 1}`;
    const newCommit = {
      id: newCommitId,
      message,
      branch: gitState.currentBranch,
      parent: headCommitId,
      isHead: true,
      isLatest: true
    };
    
    // Actualizar rama actual para apuntar al nuevo commit
    const updatedBranches = gitState.branches.map(b => 
      b.name === gitState.currentBranch 
        ? { ...b, head: newCommitId } 
        : b
    );
    
    // Actualizar estado
    setGitState({
      ...gitState,
      commits: [...updatedCommits, newCommit],
      branches: updatedBranches,
      stage: []
    });
    
    setExplanation(`Comando git commit: Guarda los cambios preparados en el repositorio con el mensaje: "${message}".`);
  };

  const handleBranch = (args: string[]) => {
    // Si no hay argumentos, listar ramas
    if (args.length === 0) {
      const branchList = gitState.branches.map(b => 
        `${b.name === gitState.currentBranch ? '* ' : '  '}${b.name}`
      ).join('\n');
      
      setExplanation(`Ramas en el repositorio:\n${branchList}`);
      return;
    }
    
    // Verificar comandos como -d, -D, etc.
    if (args[0].startsWith('-')) {
      const option = args[0];
      const branchName = args[1];
      
      if (!branchName) {
        setError(`Especifica el nombre de la rama para ${option}.`);
        return;
      }
      
      if (option === '-d' || option === '-D') {
        // Eliminar rama
        if (branchName === gitState.currentBranch) {
          setError(`No se puede eliminar la rama actual '${branchName}'. Cambia a otra rama primero.`);
          return;
        }
        
        const branchToDelete = gitState.branches.find(b => b.name === branchName);
        if (!branchToDelete) {
          setError(`La rama '${branchName}' no existe.`);
          return;
        }
        
        // Verificar si la rama está completamente fusionada
        const headCommitId = branchToDelete.head;
        const headCommit = gitState.commits.find(c => c.id === headCommitId);
        
        if (!headCommit) {
          setError('Error interno: No se pudo encontrar el commit de la rama.');
          return;
        }
        
        // Verificar si hay commits exclusivos de esta rama que se perderían
        const isMerged = gitState.commits.some(c => 
          c.id !== headCommitId && (c.secondParent === headCommitId || c.parent === headCommitId)
        );
        
        if (!isMerged && option === '-d') {
          setError(`La rama '${branchName}' no está completamente fusionada. Usa -D para forzar eliminación.`);
          return;
        }
        
        // Eliminar la rama
        const updatedBranches = gitState.branches.filter(b => b.name !== branchName);
        
        setGitState({
          ...gitState,
          branches: updatedBranches
        });
        
        setExplanation(`Eliminada la rama '${branchName}'.`);
        return;
      }
      
      setError(`Opción no reconocida: ${option}`);
      return;
    }
    
    // Crear nueva rama
    const newBranchName = args[0];
    
    // Validar que el nombre de rama no existe
    if (gitState.branches.some(b => b.name === newBranchName)) {
      setError(`La rama '${newBranchName}' ya existe.`);
      return;
    }
    
    // Obtener HEAD actual para crear la rama desde ahí
    const headCommitId = gitState.branches.find(b => b.name === gitState.currentBranch)?.head;
    
    if (!headCommitId) {
      setError('Error interno: No se pudo determinar el commit HEAD actual.');
      return;
    }
    
    // Asignar un color para la nueva rama (simulado)
    const branchColors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c'];
    const randomColor = branchColors[Math.floor(Math.random() * branchColors.length)];
    
    // Crear nueva rama
    const newBranch = {
      name: newBranchName,
      color: randomColor,
      head: headCommitId
    };
    
    setGitState({
      ...gitState,
      branches: [...gitState.branches, newBranch]
    });
    
    setExplanation(`Creada nueva rama '${newBranchName}' a partir del commit actual (${headCommitId}).`);
  };

  const handleCheckout = (args: string[]) => {
    if (args.length === 0) {
      setError('Especifica una rama o commit para checkout.');
      return;
    }
    
    // Opción para crear rama
    if (args[0] === '-b') {
      // Verificar que hay un nombre de rama
      if (args.length < 2) {
        setError('Especifica un nombre para la nueva rama.');
        return;
      }
      
      const newBranchName = args[1];
      
      // Validar que el nombre de rama no existe
      if (gitState.branches.some(b => b.name === newBranchName)) {
        setError(`La rama '${newBranchName}' ya existe.`);
        return;
      }
      
      // Obtener HEAD actual para crear la rama desde ahí
      const headCommitId = gitState.branches.find(b => b.name === gitState.currentBranch)?.head;
      
      if (!headCommitId) {
        setError('Error interno: No se pudo determinar el commit HEAD actual.');
        return;
      }
      
      // Asignar un color para la nueva rama
      const branchColors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c'];
      const randomColor = branchColors[Math.floor(Math.random() * branchColors.length)];
      
      // Crear nueva rama y cambiar a ella
      const newBranch = {
        name: newBranchName,
        color: randomColor,
        head: headCommitId
      };
      
      // Actualizar commits para reflejar el cambio de rama
      const updatedCommits = gitState.commits.map(c => {
        if (c.id === headCommitId) {
          return { ...c, isHead: true };
        }
        return { ...c, isHead: false };
      });
      
      setGitState({
        ...gitState,
        branches: [...gitState.branches, newBranch],
        currentBranch: newBranchName,
        commits: updatedCommits
      });
      
      setExplanation(`Creada y cambiada a nueva rama '${newBranchName}'.`);
      return;
    }
    
    const target = args[0];
    
    // Verificar si es una rama
    const targetBranch = gitState.branches.find(b => b.name === target);
    
    if (targetBranch) {
      // Cambiar a la rama
      const headCommitId = targetBranch.head;
      
      // Actualizar commits para reflejar nuevo HEAD
      const updatedCommits = gitState.commits.map(c => {
        if (c.id === headCommitId) {
          return { ...c, isHead: true };
        }
        return { ...c, isHead: false };
      });
      
      setGitState({
        ...gitState,
        currentBranch: targetBranch.name,
        commits: updatedCommits
      });
      
      setExplanation(`Cambiado a la rama '${targetBranch.name}'.`);
      return;
    }
    
    // Verificar si es un commit
    const targetCommit = gitState.commits.find(c => c.id === target);
    
    if (targetCommit) {
      // Actualizar commits para reflejar nuevo HEAD
      const updatedCommits = gitState.commits.map(c => {
        if (c.id === target) {
          return { ...c, isHead: true };
        }
        return { ...c, isHead: false };
      });
      
      setGitState({
        ...gitState,
        commits: updatedCommits,
        currentBranch: 'HEAD detached'
      });
      
      setExplanation(`HEAD se ha desvinculado al commit ${target}. Estás en un estado 'detached HEAD'.`);
      return;
    }
    
    setError(`No se encontró la rama o commit '${target}'.`);
  };

  const handleMerge = (args: string[]) => {
    if (args.length === 0) {
      setError('Especifica una rama para fusionar. Ejemplo: git merge <rama>');
      return;
    }
    
    const sourceBranchName = args[0];
    const sourceBranch = gitState.branches.find(b => b.name === sourceBranchName);
    
    if (!sourceBranch) {
      setError(`La rama '${sourceBranchName}' no existe.`);
      return;
    }
    
    // No se puede fusionar una rama consigo misma
    if (sourceBranchName === gitState.currentBranch) {
      setError(`No se puede fusionar una rama consigo misma.`);
      return;
    }
    
    // Obtener el commit HEAD actual
    const currentBranch = gitState.branches.find(b => b.name === gitState.currentBranch);
    if (!currentBranch) {
      setError('Error interno: No se pudo encontrar la rama actual.');
      return;
    }
    
    const currentHeadId = currentBranch.head;
    const sourceHeadId = sourceBranch.head;
    
    // Desmarcar todos los commits como HEAD/latest
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: false
    }));
    
    // Crear nuevo commit de fusión
    const newCommitId = `c${gitState.commits.length + 1}`;
    const mergeCommit = {
      id: newCommitId,
      message: `Merge branch '${sourceBranchName}' into ${gitState.currentBranch}`,
      branch: gitState.currentBranch,
      parent: currentHeadId,
      secondParent: sourceHeadId,
      isHead: true,
      isLatest: true
    };
    
    // Actualizar la rama actual para apuntar al nuevo commit
    const updatedBranches = gitState.branches.map(b => 
      b.name === gitState.currentBranch 
        ? { ...b, head: newCommitId } 
        : b
    );
    
    setGitState({
      ...gitState,
      commits: [...updatedCommits, mergeCommit],
      branches: updatedBranches
    });
    
    setExplanation(`Fusionada la rama '${sourceBranchName}' en '${gitState.currentBranch}'.`);
  };

  const handleRebase = (args: string[]) => {
    if (args.length === 0) {
      setError('Especifica una rama base para el rebase. Ejemplo: git rebase <rama>');
      return;
    }
    
    const targetBranchName = args[0];
    const targetBranch = gitState.branches.find(b => b.name === targetBranchName);
    
    if (!targetBranch) {
      setError(`La rama '${targetBranchName}' no existe.`);
      return;
    }
    
    // No se puede hacer rebase sobre sí misma
    if (targetBranchName === gitState.currentBranch) {
      setError('No se puede hacer rebase sobre la misma rama.');
      return;
    }
    
    // Obtener la rama actual y sus commits
    const currentBranch = gitState.branches.find(b => b.name === gitState.currentBranch);
    if (!currentBranch) {
      setError('Error interno: No se pudo encontrar la rama actual.');
      return;
    }
    
    const targetHeadId = targetBranch.head;
    const targetHead = gitState.commits.find(c => c.id === targetHeadId);
    
    if (!targetHead) {
      setError('Error interno: No se pudo encontrar el commit de la rama base.');
      return;
    }
    
    // Simular el rebase (simplificado para visualización)
    const newCommitId = `c${gitState.commits.length + 1}`;
    const rebasedCommit = {
      id: newCommitId,
      message: `Rebased commit from ${gitState.currentBranch}`,
      branch: gitState.currentBranch,
      parent: targetHeadId,
      isHead: true,
      isLatest: true
    };
    
    // Desmarcar todos los commits como HEAD/latest
    const updatedCommits = gitState.commits.map(c => ({
      ...c,
      isHead: false,
      isLatest: false
    }));
    
    // Actualizar la rama actual para apuntar al nuevo commit
    const updatedBranches = gitState.branches.map(b => 
      b.name === gitState.currentBranch 
        ? { ...b, head: newCommitId } 
        : b
    );
    
    setGitState({
      ...gitState,
      commits: [...updatedCommits, rebasedCommit],
      branches: updatedBranches
    });
    
    setExplanation(`Rebaseada la rama '${gitState.currentBranch}' sobre '${targetBranchName}'.`);
  };

  const handleReset = (args: string[]) => {
    if (args.length === 0) {
      setError('Especifica un modo y un commit para reset. Ejemplo: git reset --hard HEAD~1');
      return;
    }
    
    let mode = '--mixed'; // Default mode
    let target = '';
    
    // Verificar si el primer argumento es un modo o un target
    if (args[0].startsWith('--')) {
      mode = args[0];
      target = args[1] || 'HEAD~1';
    } else {
      target = args[0];
    }
    
    // Obtener el commit actual
    const currentBranch = gitState.branches.find(b => b.name === gitState.currentBranch);
    if (!currentBranch) {
      setError('Error interno: No se pudo encontrar la rama actual.');
      return;
    }
    
    let targetCommitId = '';
    
    // Interpretar target
    if (target === 'HEAD') {
      targetCommitId = currentBranch.head;
    } else if (target === 'HEAD~1') {
      // Obtener el commit padre del HEAD
      const headCommit = gitState.commits.find(c => c.id === currentBranch.head);
      if (!headCommit || !headCommit.parent) {
        setError('No hay un commit anterior al que hacer reset.');
        return;
      }
      targetCommitId = headCommit.parent;
    } else {
      // Verificar si es un ID de commit
      const targetCommit = gitState.commits.find(c => c.id === target);
      if (!targetCommit) {
        setError(`No se encontró el commit '${target}'.`);
        return;
      }
      targetCommitId = targetCommit.id;
    }
    
    // Actualizar commits para reflejar el nuevo HEAD
    const updatedCommits = gitState.commits.map(c => {
      if (c.id === targetCommitId) {
        return { ...c, isHead: true, isLatest: true };
      }
      return { ...c, isHead: false, isLatest: false };
    });
    
    // Actualizar la rama para que apunte al commit objetivo
    const updatedBranches = gitState.branches.map(b => 
      b.name === gitState.currentBranch 
        ? { ...b, head: targetCommitId } 
        : b
    );
    
    // Actualizar área de trabajo según el modo
    let newStage = [...gitState.stage];
    let newWorkingDir = [...gitState.workingDirectory];
    
    if (mode === '--hard') {
      // Eliminar cambios del área de preparación y directorio de trabajo
      newStage = [];
      newWorkingDir = [];
    } else if (mode === '--mixed') {
      // Mover cambios del área de preparación al directorio de trabajo
      newWorkingDir = [...newWorkingDir, ...newStage];
      newStage = [];
    }
    // Si es --soft, solo se mueve HEAD pero se mantiene el área de preparación
    
    setGitState({
      ...gitState,
      commits: updatedCommits,
      branches: updatedBranches,
      stage: newStage,
      workingDirectory: newWorkingDir
    });
    
    setExplanation(`Reset ${mode} al commit ${targetCommitId}.`);
  };

  const handleStatus = () => {
    // Simular el comando git status
    const branchStatus = `En la rama ${gitState.currentBranch}`;
    
    let changes = '';
    if (gitState.stage.length > 0) {
      changes += `\nCambios a commitear:\n  (use "git reset HEAD <file>..." para quitar del stage)\n`;
      gitState.stage.forEach(file => {
        changes += `\n\tarchivo nuevo: ${file}`;
      });
    }
    
    if (gitState.workingDirectory.length > 0) {
      changes += `\n\nCambios no preparados para commit:\n  (use "git add <file>..." para actualizarlos)\n`;
      gitState.workingDirectory.forEach(file => {
        changes += `\n\tmodificado: ${file}`;
      });
    }
    
    if (gitState.stage.length === 0 && gitState.workingDirectory.length === 0) {
      changes = '\nNo hay cambios para commitear, directorio de trabajo limpio';
    }
    
    setExplanation(`${branchStatus}${changes}`);
  };

  const getCommandSuggestions = () => {
    const commandNames = supportedCommands.map(cmd => cmd.name);
    if (!command) return [];
    
    // Filtrar por coincidencia parcial
    return commandNames.filter(cmd => 
      cmd.toLowerCase().startsWith(command.toLowerCase())
    );
  };

  // Actualizar sugerencias cuando cambia el comando
  useEffect(() => {
    if (command && !command.includes(' ')) {
      setSuggestions(getCommandSuggestions());
    } else {
      setSuggestions([]);
    }
  }, [command]);

  const handleLog = (_args: string[]) => {
    // Simulación simple de git log
    setExplanation('Comando git log: Muestra el historial de commits.');
  };

  const handleDiff = (_args: string[]) => {
    // Simulación simple de git diff
    setExplanation('Comando git diff: Muestra cambios entre commits, commit y directorio de trabajo, etc.');
  };

  const handleFetch = (_args: string[]) => {
    // Simulación simple de git fetch
    setExplanation('Comando git fetch: Descarga objetos y referencias de otro repositorio.');
  };

  const handlePull = (_args: string[]) => {
    // Simulación simple de git pull
    setExplanation('Comando git pull: Obtiene e integra cambios de un repositorio remoto.');
  };

  const handlePush = (_args: string[]) => {
    // Simulación simple de git push
    setExplanation('Comando git push: Actualiza referencias remotas junto con objetos asociados.');
  };

  const handleStash = (_args: string[]) => {
    // Simulación simple de git stash
    setExplanation('Comando git stash: Guarda temporalmente cambios que no están listos para commit.');
  };

  const handleTag = (_args: string[]) => {
    // Simulación simple de git tag
    setExplanation('Comando git tag: Crea, lista o elimina etiquetas.');
  };

  const handleCherryPick = (_args: string[]) => {
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
        <div className="command-list-container">
          <CommandList commands={supportedCommands} setCommand={setCommand} />
        </div>
        
        <div className="visualization-container">
          <GitGraph gitState={gitState} />
          <RepoState gitState={gitState} />
        </div>
        
        <div className="terminal-container">
          <CommandTerminal
            command={command}
            setCommand={setCommand}
            handleCommand={handleCommand}
            history={history}
            error={error}
            animating={animating}
            suggestions={suggestions}
          />
          
          <ExplanationPanel explanation={explanation} />
        </div>
      </div>
    </div>
  );
};

export default GitVisualizer;