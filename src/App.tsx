import React from 'react';
import GitVisualizer from './components/GitVisualizer/GitVisualizer';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <GitVisualizer />
    </div>
  );
};

export default App;