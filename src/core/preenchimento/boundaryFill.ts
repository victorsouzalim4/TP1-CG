/**
 * Boundary Fill (preenchimento até a cor de fronteira) — slides "CG 08 Preenchimento".
 * STUB da fase A1: os tipos são definitivos; a implementação chega na fase B.
 */
import type { Algoritmo, Passo } from '../tipos';
import type { ParametrosPreenchimento, ResultadoPreenchimento } from './comum';

export const CODIGO_BOUNDARY_FILL = '';

export const algoritmoBoundaryFill: Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> = {
  id: 'boundary-fill',
  nome: 'Boundary Fill',
  codigo: CODIGO_BOUNDARY_FILL,
  executar(): Generator<Passo, ResultadoPreenchimento, void> {
    throw new Error('não implementado');
  },
};
