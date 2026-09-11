/**
 * Flood Fill (substituição da cor interior) — slides "CG 08 Preenchimento".
 * STUB da fase A1: os tipos são definitivos; a implementação chega na fase B.
 */
import type { Algoritmo, Passo } from '../tipos';
import type { ParametrosPreenchimento, ResultadoPreenchimento } from './comum';

export const CODIGO_FLOOD_FILL = '';

export const algoritmoFloodFill: Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> = {
  id: 'flood-fill',
  nome: 'Flood Fill',
  codigo: CODIGO_FLOOD_FILL,
  executar(): Generator<Passo, ResultadoPreenchimento, void> {
    throw new Error('não implementado');
  },
};
