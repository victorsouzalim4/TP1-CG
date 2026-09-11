/**
 * Ferramenta "pivô": um clique define o ponto fixo de rotação/escala.
 */
import type { Ponto } from '../core/tipos';
import type { Ferramenta } from './tipos';
import { useFerramentaClique } from './useFerramentaClique';

export interface OpcoesFerramentaPivo {
  aoConcluir(p: Ponto): void;
}

export function useFerramentaPivo({ aoConcluir }: OpcoesFerramentaPivo): Ferramenta {
  return useFerramentaClique({ instrucao: 'Clique na célula do pivô (ponto fixo da transformação)', aoConcluir });
}
