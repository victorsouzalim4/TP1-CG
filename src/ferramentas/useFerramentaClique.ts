/**
 * Ferramenta genérica de um único clique (base de ponto, pivô e semente).
 */
import type { Ponto } from '../core/tipos';
import type { Ferramenta } from './tipos';

export interface OpcoesFerramentaClique {
  instrucao: string;
  aoConcluir(p: Ponto): void;
}

export function useFerramentaClique({ instrucao, aoConcluir }: OpcoesFerramentaClique): Ferramenta {
  return {
    instrucao,
    overlays: [],
    modoArrasto: 'nenhum',
    aoClicarCelula(p) {
      aoConcluir(p);
    },
    cancelar() {
      /* sem estado parcial */
    },
  };
}
