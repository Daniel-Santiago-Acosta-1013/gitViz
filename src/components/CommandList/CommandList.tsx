import React, { useState } from 'react';
import './CommandList.css';
import { CommandDefinition } from '../../types/git';
import CommandModal from '../CommandModal/CommandModal';

interface CommandListProps {
  commands: CommandDefinition[];
  setCommand: (command: string) => void;
}

const CommandList: React.FC<CommandListProps> = ({ commands, setCommand }) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommand, setSelectedCommand] = useState<CommandDefinition | null>(null);

  // Add clear command to the list of available commands
  const allCommands = [
    { name: 'clear', desc: 'Limpiar la terminal' },
    ...commands
  ];

  const handleCommandClick = (cmd: CommandDefinition) => {
    // Open the modal with command information
    setSelectedCommand(cmd);
    setModalOpen(true);
  };

  const handleExecuteCommand = (command: CommandDefinition) => {
    // Execute the command in the terminal
    setCommand(command.name);
  };

  return (
    <div className="command-list">
      <h3>Comandos Soportados</h3>
      <div className="commands-grid">
        {allCommands.map((cmd, index) => (
          <div
            key={index}
            className="command-item"
            onClick={() => handleCommandClick(cmd)}
          >
            <div className="command-name">{cmd.name}</div>
            <div className="command-desc">{cmd.desc}</div>
          </div>
        ))}
      </div>

      {/* Command Modal */}
      <CommandModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        command={selectedCommand}
        onExecute={handleExecuteCommand}
      />
    </div>
  );
};

export default CommandList;