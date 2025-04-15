import React, { useState, useRef, useEffect } from 'react';
import './CommandTerminal.css';
import { CommandDefinition } from '../../types/git';

interface CommandTerminalProps {
  command: string;
  setCommand: (command: string) => void;
  handleCommand: (command: string) => void;
  history: string[];
  error: string | null;
  animating: boolean;
  suggestions: CommandDefinition[] | string[] | null;
  supportedCommands?: CommandDefinition[];
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({
  command,
  setCommand,
  handleCommand,
  history,
  error,
  animating,
  supportedCommands = []
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<{
    text: string; 
    type: 'command' | 'option' | 'argument';
    description?: string;
  }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history, error]);

  // Generate suggestions based on current input
  const generateSuggestions = (input: string) => {
    if (!input.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    // Check if this is a git command
    const parts = input.trim().split(/\s+/);
    const isGitCommand = parts[0] === 'git';

    // If just "git", suggest all commands
    if (isGitCommand && parts.length === 1) {
      const cmdSuggestions = supportedCommands.map(cmd => ({
        text: cmd.name.split(' ')[1], // Extract just the command part (after "git")
        type: 'command' as const,
        description: cmd.desc
      }));
      setFilteredSuggestions(cmdSuggestions);
      return;
    }

    // If "git" plus something, filter commands or suggest options/arguments
    if (isGitCommand && parts.length > 1) {
      const currentPart = parts[parts.length - 1];
      const isTypingOption = currentPart.startsWith('-');
      
      // When typing a subcommand (git ad, git co, etc.)
      if (parts.length === 2) {
        // User is typing the command name, show matching commands
        const cmdSuggestions = supportedCommands
          .filter(cmd => {
            const cmdPart = cmd.name.split(' ')[1]; // Get the part after "git"
            return cmdPart.startsWith(parts[1]);
          })
          .map(cmd => ({
            text: cmd.name.split(' ')[1],
            type: 'command' as const,
            description: cmd.desc
          }));
        
        setFilteredSuggestions(cmdSuggestions);
        return;
      }
      
      // Find the current command for options and arguments
      const commandName = `git ${parts[1]}`;
      const currentCommand = supportedCommands.find(cmd => 
        cmd.name === commandName
      );
      
      if (currentCommand) {
        // Handle options
        if (isTypingOption && currentCommand.options) {
          const optionSuggestions = currentCommand.options
            .filter(opt => opt.option.startsWith(currentPart))
            .map(opt => ({
              text: opt.option,
              type: 'option' as const,
              description: opt.desc
            }));
          
          setFilteredSuggestions(optionSuggestions);
          return;
        }
        
        // Handle arguments if not typing an option
        if (!isTypingOption && currentCommand.arguments) {
          const argSuggestions = currentCommand.arguments
            .filter(arg => arg.name.startsWith(currentPart) || currentPart === '')
            .map(arg => ({
              text: arg.name,
              type: 'argument' as const,
              description: arg.desc
            }));
          
          setFilteredSuggestions(argSuggestions);
          return;
        }
      }
    }
    
    // Default handling for non-specific cases
    setFilteredSuggestions([]);
  };

  useEffect(() => {
    // Reset active suggestion index when filtered suggestions change
    setActiveSuggestionIndex(0);
    
    // Generate suggestions when command changes
    generateSuggestions(command);
  }, [command, supportedCommands]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow up key for history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex]);
      }
    }
    
    // Handle arrow down key for history navigation
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
    
    // Handle Tab key for suggestion selection
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        const selectedSuggestion = filteredSuggestions[activeSuggestionIndex];
        
        // Handle different types of suggestions
        if (selectedSuggestion) {
          const parts = command.trim().split(/\s+/);
          
          if (parts[0] === 'git' && parts.length === 1) {
            // Just "git", append the command
            setCommand(`git ${selectedSuggestion.text} `);
          } else if (parts[0] === 'git') {
            // Git command with additional parts
            const lastPartIndex = command.lastIndexOf(parts[parts.length - 1]);
            const newCommand = command.substring(0, lastPartIndex) + selectedSuggestion.text + ' ';
            setCommand(newCommand);
          }
        }
      }
    }
    
    // Handle navigation between suggestions
    else if (e.key === 'ArrowRight' && filteredSuggestions.length > 0) {
      e.preventDefault();
      const newIndex = (activeSuggestionIndex + 1) % filteredSuggestions.length;
      setActiveSuggestionIndex(newIndex);
    }
    else if (e.key === 'ArrowLeft' && filteredSuggestions.length > 0) {
      e.preventDefault();
      const newIndex = (activeSuggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
      setActiveSuggestionIndex(newIndex);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
    setHistoryIndex(-1);
    generateSuggestions(e.target.value);
  };

  const handleSuggestionClick = (suggestion: { text: string, type: string }) => {
    const parts = command.trim().split(/\s+/);
    
    if (parts[0] === 'git' && parts.length === 1) {
      // Just "git", append the command
      setCommand(`git ${suggestion.text} `);
    } else if (parts[0] === 'git') {
      // Git command with additional parts
      const lastPartIndex = command.lastIndexOf(parts[parts.length - 1]);
      const newCommand = command.substring(0, lastPartIndex) + suggestion.text + ' ';
      setCommand(newCommand);
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
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
      
      <div className="terminal-content" ref={contentRef}>
        {history.map((item, index) => (
          <div key={index} className="history-item">
            <span className="prompt">$</span>
            {item}
          </div>
        ))}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="command-input-container">
          <span className="prompt">$</span>
          <input
            ref={inputRef}
            className="command-input"
            type="text"
            value={command}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !animating) {
                handleCommand(command);
                setHistoryIndex(-1);
              }
            }}
            autoFocus
            disabled={animating}
          />
          <button
            className="execute-button"
            onClick={() => {
              if (!animating) {
                handleCommand(command);
                setHistoryIndex(-1);
              }
            }}
            disabled={animating}
          >
            Run
          </button>
        </div>
        
        {filteredSuggestions.length > 0 && (
          <div className="suggestions">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                data-type={suggestion.type}
                data-desc={suggestion.description || ''}
              >
                {suggestion.text}
                {index === activeSuggestionIndex && <span className="tab-indicator"></span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandTerminal; 