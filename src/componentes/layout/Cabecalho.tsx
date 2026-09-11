/**
 * Cabeçalho da aplicação: título à esquerda e conteúdo opcional à direita.
 */
import type { ReactNode } from 'react';
import './layout.css';

export interface CabecalhoProps {
  titulo: string;
  direita?: ReactNode;
}

export function Cabecalho({ titulo, direita }: CabecalhoProps) {
  return (
    <div className="cabecalho">
      <h1 className="cabecalho__titulo">{titulo}</h1>
      {direita !== undefined && <div className="cabecalho__direita">{direita}</div>}
    </div>
  );
}
