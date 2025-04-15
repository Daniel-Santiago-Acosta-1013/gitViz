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

export type CommandOptionDefinition = {
  option: string;          // Nombre de la opción (ej: -m, --message)
  desc: string;            // Descripción breve
  requiresValue?: boolean; // Si requiere un valor después
  valueDesc?: string;      // Descripción del valor esperado
};

export type CommandArgumentDefinition = {
  name: string;            // Nombre del argumento
  desc: string;            // Descripción breve
  optional?: boolean;      // Si es opcional
  examples?: string[];     // Ejemplos del argumento
};

export type CommandDefinition = {
  name: string;            // Nombre del comando principal
  desc: string;            // Descripción breve
  subcommands?: CommandDefinition[]; // Subcomandos
  options?: CommandOptionDefinition[]; // Opciones disponibles
  arguments?: CommandArgumentDefinition[]; // Argumentos posicionales
}; 