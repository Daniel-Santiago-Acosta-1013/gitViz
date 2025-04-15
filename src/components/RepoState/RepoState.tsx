import React from 'react';
import { GitState } from '../../types/git';
import './RepoState.css';

interface RepoStateProps {
  gitState: GitState;
}

const RepoState: React.FC<RepoStateProps> = ({ gitState }) => {
  return (
    <div className="repo-state">
      <div className="state-section">
        <h3>Rama actual: <span className="branch-name">{gitState.currentBranch}</span></h3>
      </div>
      <div className="state-section">
        <h3>Área de preparación:</h3>
        <div className="state-content">
          {gitState.stage.length ? (
            <ul>
              {gitState.stage.map((file, i) => (
                <li key={i}>{file}</li>
              ))}
            </ul>
          ) : (
            <p>No hay cambios preparados</p>
          )}
        </div>
      </div>
      <div className="state-section">
        <h3>Directorio de trabajo:</h3>
        <div className="state-content">
          {gitState.workingDirectory.length ? (
            <ul>
              {gitState.workingDirectory.map((file, i) => (
                <li key={i}>{file}</li>
              ))}
            </ul>
          ) : (
            <p>No hay cambios sin preparar</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoState; 