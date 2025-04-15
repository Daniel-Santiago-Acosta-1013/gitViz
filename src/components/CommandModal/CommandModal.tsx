import React, { useState, useEffect } from 'react';
import { CommandDefinition } from '../../types/git';
import './CommandModal.css';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  command: CommandDefinition | null;
  onExecute?: (command: CommandDefinition) => void;
}

const CommandModal: React.FC<CommandModalProps> = ({ isOpen, onClose, command, onExecute }) => {
  const [typedText, setTypedText] = useState<string>('');
  const [showOutput, setShowOutput] = useState<boolean>(false);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);

  // Reset states when modal opens with a new command
  useEffect(() => {
    if (isOpen && command) {
      setTypedText('');
      setShowOutput(false);
      setAnimationComplete(false);
      
      // Start typing animation
      let currentText = '';
      const fullCommand = command.name;
      let index = 0;
      
      const typingInterval = setInterval(() => {
        if (index < fullCommand.length) {
          currentText += fullCommand.charAt(index);
          setTypedText(currentText);
          index++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setShowOutput(true);
            
            // Mark animation as complete after output is shown
            setTimeout(() => {
              setAnimationComplete(true);
            }, 1000);
          }, 500);
        }
      }, 100);
      
      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [isOpen, command]);

  if (!isOpen || !command) return null;

  const handleExecute = () => {
    if (command && onExecute) {
      onExecute(command);
    }
    onClose();
  };

  // Get command-specific content based on the command name
  const getCommandContent = () => {
    const commandName = command.name.replace(/^git\s+/, '');
    
    switch (commandName) {
      case 'init':
        return {
          description: 'Inicializa un nuevo repositorio Git en el directorio actual.',
          visual: (
            <div className="command-animation">
              <div className="folder-icon"></div>
              <div className="arrow-icon">→</div>
              <div className="git-folder-icon">.git</div>
            </div>
          ),
          explanation: 'Crea una carpeta oculta .git que contiene toda la información necesaria para el control de versiones.'
        };
        
      case 'add':
        return {
          description: 'Añade archivos al área de preparación (staging area).',
          visual: (
            <div className="command-animation">
              <div className="file-icon modified"></div>
              <div className="arrow-icon">→</div>
              <div className="staging-area">Staging Area</div>
            </div>
          ),
          explanation: 'Prepara los cambios seleccionados para el próximo commit. Los archivos pasan del directorio de trabajo al área de preparación.'
        };
        
      case 'commit':
        return {
          description: 'Guarda los cambios del área de preparación en el repositorio.',
          visual: (
            <div className="command-animation">
              <div className="staging-area">Staging Area</div>
              <div className="arrow-icon">→</div>
              <div className="commit-icon">C1</div>
            </div>
          ),
          explanation: 'Crea un punto en la historia del proyecto con los cambios que estaban en el área de preparación, añadiendo un mensaje descriptivo.'
        };
        
      case 'branch':
        return {
          description: 'Crea, lista o elimina ramas en el repositorio.',
          visual: (
            <div className="command-animation">
              <div className="branch-line main">
                <span className="commit-dot">●</span>
                <span className="commit-dot">●</span>
                <span className="branch-name">main</span>
              </div>
              <div className="branch-line feature">
                <span className="commit-dot">●</span>
                <span className="branch-name">feature</span>
              </div>
            </div>
          ),
          explanation: 'Las ramas permiten trabajar en diferentes versiones del proyecto simultáneamente, facilitando el desarrollo paralelo.'
        };
        
      case 'checkout':
        return {
          description: 'Cambia entre ramas o restaura archivos del repositorio.',
          visual: (
            <div className="command-animation">
              <div className="branch-line main">
                <span className="commit-dot">●</span>
                <span className="commit-dot">●</span>
              </div>
              <div className="branch-line feature active">
                <span className="commit-dot">●</span>
                <span className="head-pointer">HEAD</span>
              </div>
            </div>
          ),
          explanation: 'Actualiza los archivos en el directorio de trabajo para que coincidan con la versión en la rama o commit especificado.'
        };
        
      case 'merge':
        return {
          description: 'Combina los cambios de una rama con otra rama activa.',
          visual: (
            <div className="command-animation">
              <div className="branch-line main">
                <span className="commit-dot">●</span>
                <span className="commit-dot">●</span>
                <span className="commit-dot merge">●</span>
              </div>
              <div className="branch-line feature">
                <span className="commit-dot">●</span>
                <span className="commit-dot">●</span>
                <span className="merge-arrow">↗</span>
              </div>
            </div>
          ),
          explanation: 'Incorpora todos los cambios de una rama en otra, creando un nuevo commit de fusión si es necesario.'
        };
        
      // Agregar más comandos aquí siguiendo el mismo patrón
      
      default:
        return {
          description: command.desc,
          visual: <div className="command-animation generic"></div>,
          explanation: 'Este comando es parte de Git, el sistema de control de versiones más popular.'
        };
    }
  };

  const commandContent = getCommandContent();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="command-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Comando: {command.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-controls">
              <span className="control red"></span>
              <span className="control yellow"></span>
              <span className="control green"></span>
            </div>
            <div className="terminal-title">Terminal</div>
          </div>
          
          <div className="terminal-body">
            <div className="terminal-prompt">
              <span className="prompt-symbol">$</span> {typedText}
              {!animationComplete && <span className="cursor">|</span>}
            </div>
            
            {showOutput && (
              <div className="terminal-output">
                <div className="command-description">
                  {commandContent.description}
                </div>
                
                <div className="visual-container">
                  {commandContent.visual}
                </div>
                
                <div className="command-explanation">
                  <h4>¿Qué hace este comando?</h4>
                  <p>{commandContent.explanation}</p>
                </div>
                
                {command.options && command.options.length > 0 && (
                  <div className="command-options">
                    <h4>Opciones comunes:</h4>
                    <ul>
                      {command.options.slice(0, 3).map((option, index) => (
                        <li key={index}>
                          <code>{option.option}</code> - {option.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button className="execute-button" onClick={handleExecute}>
                    Ejecutar Comando
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandModal; 