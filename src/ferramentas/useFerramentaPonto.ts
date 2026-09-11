/**
 * Ferramenta "ponto": um clique define o ponto.
 */
import type { Ponto } from '../core/tipos';
import type { Ferramenta } from './tipos';
import { useFerramentaClique } from './useFerramentaClique';

export interface OpcoesFerramentaPonto {
  aoConcluir(p: Ponto): void;
}

export function useFerramentaPonto({ aoConcluir }: OpcoesFerramentaPonto): Ferramenta {
  return useFerramentaClique({ instrucao: 'Clique na célula do ponto', aoConcluir });
}
