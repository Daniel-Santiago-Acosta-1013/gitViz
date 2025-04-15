// Tipos para las estructuras de datos de Git
import * as d3 from 'd3';

export type CommitNode = {
  id: string;
  message: string;
  branch: string;
  parent?: string;
  secondParent?: string;
  highlighted?: boolean;
  isHead?: boolean;
  isLatest?: boolean;
  // D3 utilizará estas propiedades para posicionamiento
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

export type Branch = {
  name: string;
  color: string;
  head: string;
};

export type GitState = {
  commits: CommitNode[];
  branches: Branch[];
  currentBranch: string;
  stage: string[];
  workingDirectory: string[];
};

// Tipos para D3
export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  commit: CommitNode;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  isMerge?: boolean;
}

export type CommandDefinition = {
  name: string;
  desc: string;
}; 