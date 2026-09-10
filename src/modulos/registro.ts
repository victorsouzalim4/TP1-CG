/**
 * Registro dos módulos da aplicação (um por algoritmo).
 * A barra lateral é gerada a partir desta lista; o store guarda apenas o `ModuloId` ativo.
 */
import type { ComponentType } from 'react';
import { ModuloDDA } from './dda/ModuloDDA';
import { ModuloBresenhamReta } from './bresenhamReta/ModuloBresenhamReta';
import { ModuloBresenhamCirculo } from './bresenhamCirculo/ModuloBresenhamCirculo';
import { ModuloCohenSutherland } from './recorte/ModuloCohenSutherland';
import { ModuloLiangBarsky } from './recorte/ModuloLiangBarsky';
import { ModuloTransformacoes } from './transformacoes/ModuloTransformacoes';
import { ModuloBoundaryFill } from './preenchimento/ModuloBoundaryFill';
import { ModuloFloodFill } from './preenchimento/ModuloFloodFill';
import { ModuloLivre } from './livre/ModuloLivre';

export type ModuloId =
  | 'dda'
  | 'bresenham-reta'
  | 'bresenham-circulo'
  | 'cohen-sutherland'
  | 'liang-barsky'
  | 'transformacoes'
  | 'boundary-fill'
  | 'flood-fill'
  | 'livre';

export type GrupoModulo = 'Rasterização' | 'Recorte' | 'Transformações' | 'Preenchimento' | 'Livre';

export interface DefinicaoModulo {
  id: ModuloId;
  titulo: string;
  grupo: GrupoModulo;
  /** Componente que renderiza o painel lateral e a grade (via LayoutModulo). */
  componente: ComponentType;
}

export const MODULOS: readonly DefinicaoModulo[] = [
  { id: 'dda', titulo: 'Reta - DDA', grupo: 'Rasterização', componente: ModuloDDA },
  { id: 'bresenham-reta', titulo: 'Reta - Bresenham', grupo: 'Rasterização', componente: ModuloBresenhamReta },
  { id: 'bresenham-circulo', titulo: 'Circunferência - Bresenham', grupo: 'Rasterização', componente: ModuloBresenhamCirculo },
  { id: 'cohen-sutherland', titulo: 'Cohen-Sutherland', grupo: 'Recorte', componente: ModuloCohenSutherland },
  { id: 'liang-barsky', titulo: 'Liang-Barsky', grupo: 'Recorte', componente: ModuloLiangBarsky },
  { id: 'transformacoes', titulo: 'Transformações 2D', grupo: 'Transformações', componente: ModuloTransformacoes },
  { id: 'boundary-fill', titulo: 'Boundary Fill', grupo: 'Preenchimento', componente: ModuloBoundaryFill },
  { id: 'flood-fill', titulo: 'Flood Fill', grupo: 'Preenchimento', componente: ModuloFloodFill },
  { id: 'livre', titulo: 'Modo Livre', grupo: 'Livre', componente: ModuloLivre },
];

export const MODULO_PADRAO: ModuloId = 'dda';

export function obterModulo(id: ModuloId): DefinicaoModulo {
  const m = MODULOS.find((x) => x.id === id);
  if (!m) throw new Error(`Módulo desconhecido: ${id}`);
  return m;
}
