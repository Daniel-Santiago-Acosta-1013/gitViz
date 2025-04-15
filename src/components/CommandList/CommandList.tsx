import React from 'react';
import { CommandDefinition } from '../../types/git';
import './CommandList.css';

interface CommandListProps {
  commands: CommandDefinition[];
  setCommand: (command: string) => void;
}

const CommandList: React.FC<CommandListProps> = ({ commands, setCommand }) => {
  return (
    <div className="command-list">
      <h3>Comandos Soportados</h3>
      <div className="commands-grid">
        {commands.map((cmd, i) => (
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
  );
};

export default CommandList; 