import React, { useState } from 'react';
import './CommandTerminal.css';

interface CommandTerminalProps {
  command: string;
  setCommand: (command: string) => void;
  handleCommand: () => void;
  history: string[];
  error: string;
  animating: boolean;
  suggestions: string[];
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({
  command,
  setCommand,
  handleCommand,
  history,
  error,
  animating,
  suggestions
}) => {
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
  );
};

export default CommandTerminal; 