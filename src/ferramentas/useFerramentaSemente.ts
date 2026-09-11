/**
 * Ferramenta "semente": um clique define a célula inicial do preenchimento.
 */
import type { Ponto } from '../core/tipos';
import type { Ferramenta } from './tipos';
import { useFerramentaClique } from './useFerramentaClique';

export interface OpcoesFerramentaSemente {
  aoConcluir(p: Ponto): void;
}

export function useFerramentaSemente({ aoConcluir }: OpcoesFerramentaSemente): Ferramenta {
  return useFerramentaClique({ instrucao: 'Clique na semente (célula inicial do preenchimento)', aoConcluir });
}
