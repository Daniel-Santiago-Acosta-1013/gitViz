import React, { useState, useEffect } from 'react';
import './ExplanationPanel.css';

interface ExplanationPanelProps {
  explanation: string;
  onClose?: () => void;
  autoHideDelay?: number; // Time in ms after which tooltip auto-hides
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ 
  explanation, 
  onClose, 
  autoHideDelay = 8000 // Default 8 seconds
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the tooltip when explanation changes
    if (explanation) {
      setIsVisible(true);
      
      // Set up auto-hide timer if autoHideDelay is provided
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [explanation, autoHideDelay]);

  // Don't render if no explanation or not visible
  if (!explanation || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="explanation-tooltip">
      <div className="tooltip-header">
        <div className="tooltip-buttons">
          <span className="tooltip-button red"></span>
          <span className="tooltip-button yellow"></span>
          <span className="tooltip-button green"></span>
        </div>
        <div className="tooltip-title">Command Info</div>
        <button className="tooltip-close" onClick={handleClose}>×</button>
      </div>
      <div className="tooltip-content">
        <pre>{explanation}</pre>
      </div>
    </div>
  );
};

export default ExplanationPanel; 