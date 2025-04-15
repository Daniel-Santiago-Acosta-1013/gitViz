import React from 'react';
import './CommandList.css';
import { CommandDefinition } from '../../types/git';

interface CommandListProps {
  commands: CommandDefinition[];
  setCommand: (command: string) => void;
}

const CommandList: React.FC<CommandListProps> = ({ commands, setCommand }) => {
  // Add clear command to the list of available commands
  const allCommands = [
    { name: 'clear', desc: 'Limpiar la terminal' },
    ...commands
  ];

  const handleCommandClick = (cmdName: string) => {
    setCommand(cmdName);
  };

  return (
    <div className="command-list">
      <h3>Comandos Soportados</h3>
      <div className="commands-grid">
        {allCommands.map((cmd, index) => (
          <div
            key={index}
            className="command-item"
            onClick={() => handleCommandClick(cmd.name)}
          >
            <div className="command-name">{cmd.name}</div>
            <div className="command-desc">{cmd.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommandList;