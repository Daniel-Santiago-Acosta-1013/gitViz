import React from 'react';
import './ExplanationPanel.css';

interface ExplanationPanelProps {
  explanation: string;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ explanation }) => {
  return (
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
  );
};

export default ExplanationPanel; 