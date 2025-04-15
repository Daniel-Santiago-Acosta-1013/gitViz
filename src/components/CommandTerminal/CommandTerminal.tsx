import React, { useState, useRef, useEffect } from 'react';
import './CommandTerminal.css';
import { CommandDefinition } from '../../types/git';

interface CommandTerminalProps {
  command: string;
  setCommand: (command: string) => void;
  handleCommand: () => void;
  history: string[];
  error: string;
  animating: boolean;
  suggestions: string[];
  supportedCommands: CommandDefinition[];
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({
  command,
  setCommand,
  handleCommand,
  history,
  error,
  animating,
  suggestions,
  supportedCommands
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [inputHistory, setInputHistory] = useState<string>(command);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Efecto para actualizar las sugerencias filtradas cuando cambian las sugerencias
  useEffect(() => {
    setFilteredSuggestions(suggestions);
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Manejar navegación del historial y autocompletado con Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navegar por el historial con flechas arriba/abajo
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        // Si estamos en la entrada actual, guardémosla
        if (historyIndex === -1) {
          setInputHistory(command);
        }
        
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        
        if (newIndex === -1) {
          // Volver a la entrada que estaba escribiendo
          setCommand(inputHistory);
        } else {
          setCommand(history[history.length - 1 - newIndex]);
        }
      }
    }
    // Autocompletado con Tab
    else if (e.key === 'Tab') {
      e.preventDefault();
      
      if (filteredSuggestions.length > 0) {
        // Si hay una sugerencia activa, usarla
        if (activeSuggestionIndex >= 0) {
          setCommand(filteredSuggestions[activeSuggestionIndex]);
        } 
        // De lo contrario, usar la primera sugerencia
        else {
          setCommand(filteredSuggestions[0]);
        }
      } else {
        handleTabCompletion();
      }
    }
    // Navegación a través de sugerencias
    else if (e.key === 'ArrowRight' && e.altKey) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        const nextIndex = activeSuggestionIndex < filteredSuggestions.length - 1 
          ? activeSuggestionIndex + 1 
          : 0;
        setActiveSuggestionIndex(nextIndex);
      }
    }
    else if (e.key === 'ArrowLeft' && e.altKey) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        const prevIndex = activeSuggestionIndex > 0 
          ? activeSuggestionIndex - 1 
          : filteredSuggestions.length - 1;
        setActiveSuggestionIndex(prevIndex);
      }
    }
    // Ejecutar comando con Enter
    else if (e.key === 'Enter') {
      setHistoryIndex(-1);
      handleCommand();
    }
    // Resetear el índice de historial para cualquier otra tecla
    else {
      setHistoryIndex(-1);
    }
  };

  // Función para manejar el autocompletado con Tab
  const handleTabCompletion = () => {
    const parts = command.trim().split(/\s+/);
    
    // Si no hay entrada, sugerir 'git'
    if (command.trim() === '') {
      setCommand('git ');
      return;
    }

    // Si solo está 'git', mostrar todos los comandos git
    if (parts.length === 1 && parts[0] === 'git') {
      const completions = supportedCommands.map(cmd => {
        // Extraer el subcomando (git add → add)
        const subCommand = cmd.name.split(' ')[1];
        return `git ${subCommand} `;
      });
      setFilteredSuggestions(completions);
      return;
    }

    // Si es un comando git con un subcomando
    if (parts.length >= 2 && parts[0] === 'git') {
      const gitCommand = parts[1];
      const commandDef = supportedCommands.find(cmd => {
        const cmdName = cmd.name.split(' ')[1];
        return cmdName === gitCommand;
      });

      if (commandDef) {
        // Completar opciones
        if (parts.length >= 3 && commandDef.options?.length) {
          const lastPart = parts[parts.length - 1];
          
          // Si el último carácter es un espacio, mostrar todas las opciones
          if (command.endsWith(' ')) {
            const optionCompletions = commandDef.options.map(opt => `${opt.option} `);
            setFilteredSuggestions(optionCompletions);
            return;
          }
          
          // Si empieza con guión, buscar opciones que coincidan
          if (lastPart.startsWith('-')) {
            const matchingOptions = commandDef.options
              .filter(opt => opt.option.startsWith(lastPart))
              .map(opt => {
                // Reemplazar la última parte con la opción completa
                const newParts = [...parts.slice(0, -1), opt.option];
                return newParts.join(' ') + ' ';
              });
            
            if (matchingOptions.length > 0) {
              setFilteredSuggestions(matchingOptions);
              return;
            }
          }
        }
        
        // Completar argumentos
        if (commandDef.arguments?.length) {
          // Solo mostrar argumentos si no estamos escribiendo una opción
          const lastPart = parts[parts.length - 1];
          if (!lastPart.startsWith('-') || command.endsWith(' ')) {
            const argumentCompletions = commandDef.arguments
              .filter(arg => arg.examples && arg.examples.length > 0)
              .flatMap(arg => arg.examples || [])
              .map(example => {
                // Si termina en espacio, agregar el ejemplo
                if (command.endsWith(' ')) {
                  return `${command}${example} `;
                }
                // Si no, reemplazar la última parte
                const newParts = [...parts.slice(0, -1), example];
                return newParts.join(' ') + ' ';
              });
            
            if (argumentCompletions.length > 0) {
              setFilteredSuggestions(argumentCompletions);
              return;
            }
          }
        }
      }
    }
  };

  // Filtrar sugerencias mientras el usuario escribe
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    setCommand(userInput);
    
    // Resetear el índice de sugerencias activas
    setActiveSuggestionIndex(-1);
    
    // Si hay sugerencias, filtrarlas según la entrada
    if (suggestions.length > 0) {
      const filtered = suggestions.filter(
        suggestion => suggestion.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  };

  return (
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
            ref={inputRef}
            type="text"
            value={command}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando Git..."
            className="command-input"
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
        
        {filteredSuggestions.length > 0 && (
          <div className="suggestions">
            {filteredSuggestions.map((s, i) => (
              <div 
                key={i} 
                className={`suggestion-item ${i === activeSuggestionIndex ? 'active' : ''}`}
                onClick={() => setCommand(s)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandTerminal; 