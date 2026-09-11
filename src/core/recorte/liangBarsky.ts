/**
 * Recorte de retas de Liang-Barsky — slides "CG 07 Recorte".
 * STUB da fase A1: os tipos são definitivos; a implementação chega na fase B.
 */
import type { Algoritmo, Passo } from '../tipos';
import type { ParametrosRecorte, ResultadoRecorte } from './comum';

export type { ParametrosRecorte, ResultadoRecorte } from './comum';

export const CODIGO_LIANG_BARSKY = '';

export const algoritmoLiangBarsky: Algoritmo<ParametrosRecorte, ResultadoRecorte> = {
  id: 'liang-barsky',
  nome: 'Liang-Barsky',
  codigo: CODIGO_LIANG_BARSKY,
  executar(): Generator<Passo, ResultadoRecorte, void> {
    throw new Error('não implementado');
  },
};
