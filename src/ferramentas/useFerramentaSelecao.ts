/**
 * Ferramenta "seleção por região": arrastar define um retângulo (`modoArrasto: 'selecao'`);
 * um clique simples seleciona a região de uma única célula (útil para pegar um vértice).
 * `regiaoAtual` é o retângulo em andamento, para passar em `PixelGrid.regiaoSelecao`.
 */
import { useState } from 'react';
import type { Retangulo } from '../core/tipos';
import { retanguloDeCelula, type Ferramenta } from './tipos';

export interface OpcoesFerramentaSelecao {
  aoSelecionar(r: Retangulo): void;
  /** Chamado a cada movimento do arrasto (opcional; `regiaoAtual` já reflete o retângulo). */
  aoMover?(r: Retangulo): void;
}

export interface FerramentaSelecao extends Ferramenta {
  regiaoAtual: Retangulo | null;
}

export function useFerramentaSelecao({ aoSelecionar, aoMover }: OpcoesFerramentaSelecao): FerramentaSelecao {
  const [regiao, setRegiao] = useState<Retangulo | null>(null);

  return {
    instrucao: 'Arraste um retângulo para selecionar objetos (um clique seleciona a célula)',
    overlays: [],
    modoArrasto: 'selecao',
    regiaoAtual: regiao,
    aoClicarCelula(p) {
      setRegiao(null);
      aoSelecionar(retanguloDeCelula(p));
    },
    aoArrastoMover(r) {
      setRegiao(r);
      aoMover?.(r);
    },
    aoArrastoFim(r) {
      setRegiao(null);
      aoSelecionar(r);
    },
    cancelar() {
      setRegiao(null);
    },
  };
}
