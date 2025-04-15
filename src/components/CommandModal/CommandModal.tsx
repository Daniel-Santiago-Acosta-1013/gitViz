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
  const [animationStep, setAnimationStep] = useState<number>(0);

  // Reset states when modal opens with a new command
  useEffect(() => {
    if (isOpen && command) {
      setTypedText('');
      setShowOutput(false);
      setAnimationComplete(false);
      setAnimationStep(0);
      
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
            
            // Start animation sequence
            const animationSequence = setInterval(() => {
              setAnimationStep(prev => {
                const nextStep = prev + 1;
                if (nextStep >= 3) { // Assuming 3 steps for most animations
                  clearInterval(animationSequence);
                  setAnimationComplete(true);
                }
                return nextStep;
              });
            }, 1500); // Time between animation steps
            
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
              <div className={`init-animation step-${animationStep}`}>
                <div className="folder-container">
                  <div className="folder-icon"></div>
                  <div className="folder-label">Directorio</div>
                </div>
                <div className="arrow-icon">→</div>
                <div className="folder-container">
                  <div className={`git-folder-icon ${animationStep >= 1 ? 'visible' : ''}`}>.git</div>
                  <div className="folder-label">Repositorio</div>
                </div>
                <div className={`init-details ${animationStep >= 2 ? 'visible' : ''}`}>
                  <div className="detail-item">
                    <div className="detail-icon config"></div>
                    <span>config</span>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon head"></div>
                    <span>HEAD</span>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon objects"></div>
                    <span>objects/</span>
                  </div>
                </div>
              </div>
            </div>
          ),
          explanation: 'Crea una carpeta oculta .git que contiene toda la estructura necesaria para el control de versiones: configuración, referencias y objetos de la base de datos Git.'
        };
        
      case 'add':
        return {
          description: 'Añade archivos al área de preparación (staging area).',
          visual: (
            <div className="command-animation">
              <div className={`add-animation step-${animationStep}`}>
                <div className="workspace-container">
                  <div className="workspace-label">Directorio de trabajo</div>
                  <div className="file-container">
                    <div className={`file-icon ${animationStep >= 1 ? 'modified' : ''}`}></div>
                    <div className="file-icon"></div>
                    <div className="file-icon modified"></div>
                  </div>
                </div>
                <div className={`tracking-arrow ${animationStep >= 1 ? 'active' : ''}`}>→</div>
                <div className="staging-container">
                  <div className="staging-label">Área de preparación</div>
                  <div className="staging-area">
                    <div className={`staged-file ${animationStep >= 2 ? 'visible' : ''}`}></div>
                    <div className={`staged-file ${animationStep >= 2 ? 'visible' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
          ),
          explanation: 'Registra los cambios de los archivos seleccionados en el área de preparación (staging). Este paso es previo al commit y permite seleccionar exactamente qué cambios incluir.'
        };
        
      case 'commit':
        return {
          description: 'Guarda los cambios del área de preparación en el repositorio.',
          visual: (
            <div className="command-animation">
              <div className={`commit-animation step-${animationStep}`}>
                <div className="staging-container">
                  <div className="staging-label">Área de preparación</div>
                  <div className="staging-area">
                    <div className={`staged-file ${animationStep >= 1 ? 'prepare' : ''}`}></div>
                    <div className={`staged-file ${animationStep >= 1 ? 'prepare' : ''}`}></div>
                  </div>
                </div>
                <div className={`tracking-arrow ${animationStep >= 1 ? 'active' : ''}`}>→</div>
                <div className="repository-container">
                  <div className="repository-label">Repositorio</div>
                  <div className="commit-history">
                    <div className={`commit-node ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="commit-hash">a2b3c4d</span>
                      <div className="commit-message">
                        <span>"Añadir nuevas características"</span>
                      </div>
                      <div className="commit-time">Hace 2 minutos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          explanation: 'Crea un nuevo commit (instantánea permanente) en la historia del proyecto con los cambios preparados, asignándole un identificador único y almacenando el mensaje descriptivo.'
        };
        
      case 'branch':
        return {
          description: 'Crea, lista o elimina ramas en el repositorio.',
          visual: (
            <div className="command-animation">
              <div className={`branch-animation step-${animationStep}`}>
                <div className="branch-timeline">
                  <div className="timeline-container">
                    <div className="main-branch">
                      <div className="branch-label">main</div>
                      <div className="commit-chain">
                        <div className="commit-dot">
                          <span className="commit-hash">a1b2c3</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">d4e5f6</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot head">
                          <span className="commit-hash">g7h8i9</span>
                          <div className="head-indicator">HEAD</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`feature-branch ${animationStep >= 1 ? 'creating' : ''}`}>
                      <div className="branch-label">feature</div>
                      <div className={`branch-pointer ${animationStep >= 2 ? 'visible' : ''}`}>
                        <div className="pointer-line"></div>
                        <div className="pointer-head"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`branch-command ${animationStep >= 1 ? 'visible' : ''}`}>
                  <code>$ git branch feature</code>
                </div>
              </div>
            </div>
          ),
          explanation: 'Crea una nueva línea de desarrollo que diverge de la principal. Las ramas permiten trabajar en características o correcciones sin afectar la rama principal, facilitando el desarrollo paralelo.'
        };
        
      case 'checkout':
        return {
          description: 'Cambia entre ramas o restaura archivos del repositorio.',
          visual: (
            <div className="command-animation">
              <div className={`checkout-animation step-${animationStep}`}>
                <div className="branch-timeline">
                  <div className="timeline-container">
                    <div className="main-branch">
                      <div className="branch-label">main</div>
                      <div className="commit-chain">
                        <div className="commit-dot">
                          <span className="commit-hash">a1b2c3</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">d4e5f6</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className={`commit-dot ${animationStep < 1 ? 'head' : ''}`}>
                          <span className="commit-hash">g7h8i9</span>
                          <div className={`head-indicator ${animationStep < 1 ? 'visible' : 'moving'}`}>HEAD</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="feature-branch">
                      <div className="branch-label">feature</div>
                      <div className="branch-pointer">
                        <div className="pointer-line"></div>
                        <div className="pointer-head"></div>
                      </div>
                      <div className={`feature-commit-dot ${animationStep >= 2 ? 'head' : ''}`}>
                        <span className="commit-hash">j1k2l3</span>
                        <div className={`head-indicator ${animationStep >= 2 ? 'visible' : ''}`}>HEAD</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="workspace-changes">
                  <div className="workspace-label">Directorio de trabajo</div>
                  <div className={`files-container ${animationStep >= 1 ? 'changing' : ''} ${animationStep >= 2 ? 'changed' : ''}`}>
                    <div className="file-block"></div>
                    <div className="file-block"></div>
                    <div className="file-block"></div>
                  </div>
                </div>
                
                <div className={`checkout-command ${animationStep >= 1 ? 'visible' : ''}`}>
                  <code>$ git checkout feature</code>
                </div>
              </div>
            </div>
          ),
          explanation: 'Cambia la rama activa y actualiza los archivos del directorio de trabajo para que coincidan con la versión de esa rama. También mueve el puntero HEAD a la rama seleccionada.'
        };
        
      case 'merge':
        return {
          description: 'Combina los cambios de una rama con otra rama activa.',
          visual: (
            <div className="command-animation">
              <div className={`merge-animation step-${animationStep}`}>
                <div className="branch-timeline">
                  <div className="timeline-container">
                    <div className="main-branch">
                      <div className="branch-label">main</div>
                      <div className="commit-chain">
                        <div className="commit-dot">
                          <span className="commit-hash">a1b2c3</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">d4e5f6</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot head">
                          <span className="commit-hash">g7h8i9</span>
                          <div className="head-indicator">HEAD</div>
                        </div>
                        <div className={`commit-connector ${animationStep >= 2 ? 'growing' : 'hidden'}`}></div>
                        <div className={`merge-commit-dot ${animationStep >= 2 ? 'visible' : 'hidden'}`}>
                          <span className="commit-hash">m1n2o3</span>
                          <div className="merge-label">Merge</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="feature-branch">
                      <div className="branch-label">feature</div>
                      <div className="branch-pointer">
                        <div className="pointer-line"></div>
                        <div className="pointer-head"></div>
                      </div>
                      <div className="feature-commit-dot">
                        <span className="commit-hash">j1k2l3</span>
                      </div>
                      <div className={`merge-arrow ${animationStep >= 1 ? 'active' : ''}`}></div>
                    </div>
                  </div>
                </div>
                
                <div className={`merge-command ${animationStep >= 1 ? 'visible' : ''}`}>
                  <code>$ git merge feature</code>
                </div>
                
                <div className={`merge-message ${animationStep >= 2 ? 'visible' : ''}`}>
                  <span>Merge branch 'feature' into main</span>
                </div>
              </div>
            </div>
          ),
          explanation: 'Integra los cambios de una rama (como "feature") en la rama actual (como "main"). Crea un commit de fusión que tiene dos padres, representando la historia de ambas ramas.'
        };
        
      case 'rebase':
        return {
          description: 'Reorganiza commits para una historia lineal.',
          visual: (
            <div className="command-animation">
              <div className={`rebase-animation step-${animationStep}`}>
                <div className="rebase-before">
                  <div className="timeline-container">
                    <div className="main-branch">
                      <div className="branch-label">main</div>
                      <div className="commit-chain">
                        <div className="commit-dot">
                          <span className="commit-hash">a1b2c3</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">d4e5f6</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">g7h8i9</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="feature-branch">
                      <div className="branch-label">feature</div>
                      <div className="branch-pointer">
                        <div className="pointer-line"></div>
                        <div className="pointer-head"></div>
                      </div>
                      <div className="feature-commit-dot head">
                        <span className="commit-hash">j1k2l3</span>
                        <div className="head-indicator">HEAD</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`rebase-arrow ${animationStep >= 1 ? 'active' : ''}`}>
                  <div className="arrow-shaft"></div>
                  <div className="arrow-head"></div>
                </div>
                
                <div className={`rebase-after ${animationStep >= 2 ? 'visible' : ''}`}>
                  <div className="timeline-container">
                    <div className="main-branch">
                      <div className="branch-label">main</div>
                      <div className="commit-chain">
                        <div className="commit-dot">
                          <span className="commit-hash">a1b2c3</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">d4e5f6</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot">
                          <span className="commit-hash">g7h8i9</span>
                        </div>
                        <div className="commit-connector"></div>
                        <div className="commit-dot rebased head">
                          <span className="commit-hash">j1k2l3'</span>
                          <div className="head-indicator">HEAD</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`rebase-command ${animationStep >= 1 ? 'visible' : ''}`}>
                  <code>$ git rebase main</code>
                </div>
              </div>
            </div>
          ),
          explanation: 'Reorganiza los commits de una rama encima de otra rama. A diferencia de merge, rebase crea una historia lineal al recrear los commits de la rama origen sobre la rama destino.'
        };
        
      case 'reset':
        return {
          description: 'Deshace cambios o commits.',
          visual: (
            <div className="command-animation">
              <div className={`reset-animation step-${animationStep}`}>
                <div className="commit-timeline">
                  <div className="commit-chain">
                    <div className="commit-dot">
                      <span className="commit-hash">a1b2c3</span>
                    </div>
                    <div className="commit-connector"></div>
                    <div className="commit-dot">
                      <span className="commit-hash">d4e5f6</span>
                    </div>
                    <div className="commit-connector"></div>
                    <div className={`commit-dot ${animationStep < 1 ? 'head' : ''}`}>
                      <span className="commit-hash">g7h8i9</span>
                      <div className={`head-indicator ${animationStep < 1 ? 'visible' : ''}`}>HEAD</div>
                    </div>
                    <div className={`commit-connector ${animationStep >= 2 ? 'faded' : ''}`}></div>
                    <div className={`commit-dot ${animationStep >= 2 ? 'faded' : ''}`}>
                      <span className="commit-hash">j1k2l3</span>
                    </div>
                  </div>
                </div>
                
                <div className={`reset-pointer ${animationStep >= 1 ? 'moving' : ''}`}>
                  <div className="head-arrow"></div>
                  <div className="head-label">HEAD</div>
                </div>
                
                <div className={`workspace-changes ${animationStep >= 2 ? 'visible' : ''}`}>
                  <div className="reset-type soft">
                    <span className="reset-label">--soft</span>
                    <div className="staging-indicator full"></div>
                    <div className="workspace-indicator full"></div>
                  </div>
                  
                  <div className="reset-type mixed">
                    <span className="reset-label">--mixed</span>
                    <div className="staging-indicator empty"></div>
                    <div className="workspace-indicator full"></div>
                  </div>
                  
                  <div className="reset-type hard">
                    <span className="reset-label">--hard</span>
                    <div className="staging-indicator empty"></div>
                    <div className="workspace-indicator empty"></div>
                  </div>
                </div>
                
                <div className={`reset-command ${animationStep >= 1 ? 'visible' : ''}`}>
                  <code>$ git reset d4e5f6</code>
                </div>
              </div>
            </div>
          ),
          explanation: 'Mueve el HEAD y la rama actual a un commit específico. Según la opción usada, puede afectar el área de preparación y el directorio de trabajo: --soft (mantiene cambios preparados), --mixed (desanda preparación), --hard (descarta todos los cambios).'
        };
        
      case 'status':
        return {
          description: 'Muestra el estado del repositorio.',
          visual: (
            <div className="command-animation">
              <div className={`status-animation step-${animationStep}`}>
                <div className="status-display">
                  <div className={`terminal-output ${animationStep >= 1 ? 'typing' : ''}`}>
                    <div className="output-line branch">
                      <span className="output-text">On branch </span>
                      <span className="output-highlight">main</span>
                    </div>
                    <div className="output-line">
                      <span className="output-text">Your branch is up to date with 'origin/main'</span>
                    </div>
                    <div className="output-line spacer"></div>
                    <div className={`output-line ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="output-text">Changes to be committed:</span>
                    </div>
                    <div className={`output-line staged ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="file-status">modified: </span>
                      <span className="file-name">src/App.js</span>
                    </div>
                    <div className="output-line spacer"></div>
                    <div className={`output-line ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="output-text">Changes not staged for commit:</span>
                    </div>
                    <div className={`output-line modified ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="file-status">modified: </span>
                      <span className="file-name">src/components/Header.js</span>
                    </div>
                    <div className="output-line spacer"></div>
                    <div className={`output-line ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="output-text">Untracked files:</span>
                    </div>
                    <div className={`output-line untracked ${animationStep >= 2 ? 'visible' : ''}`}>
                      <span className="file-name">src/components/NewFeature.js</span>
                    </div>
                  </div>
                </div>
                
                <div className={`status-diagram ${animationStep >= 2 ? 'visible' : ''}`}>
                  <div className="workspace-area">
                    <div className="area-label">Directorio de trabajo</div>
                    <div className="file modified"></div>
                    <div className="file untracked"></div>
                  </div>
                  <div className="staging-area">
                    <div className="area-label">Área de preparación</div>
                    <div className="file staged"></div>
                  </div>
                  <div className="repository-area">
                    <div className="area-label">Repositorio</div>
                    <div className="commit-icon"></div>
                  </div>
                </div>
              </div>
            </div>
          ),
          explanation: 'Muestra el estado actual del directorio de trabajo y del área de preparación. Indica qué archivos están modificados, preparados o sin seguimiento, y también muestra la rama actual.'
        };
        
      // Agregar más comandos siguiendo el mismo patrón
      
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