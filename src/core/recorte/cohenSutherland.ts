/**
 * Recorte de retas de Cohen-Sutherland — slides "CG 07 Recorte".
 * STUB da fase A1: os tipos são definitivos; a implementação chega na fase B.
 */
import type { Algoritmo, Passo } from '../tipos';
import type { ParametrosRecorte, ResultadoRecorte } from './comum';

export type { ParametrosRecorte, ResultadoRecorte } from './comum';

export const CODIGO_COHEN_SUTHERLAND = '';

export const algoritmoCohenSutherland: Algoritmo<ParametrosRecorte, ResultadoRecorte> = {
  id: 'cohen-sutherland',
  nome: 'Cohen-Sutherland',
  codigo: CODIGO_COHEN_SUTHERLAND,
  executar(): Generator<Passo, ResultadoRecorte, void> {
    throw new Error('não implementado');
  },
};
