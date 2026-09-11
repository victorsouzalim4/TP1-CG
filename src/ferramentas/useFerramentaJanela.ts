/**
 * Ferramenta "janela de recorte": arrastar define o retângulo da janela (`modoArrasto: 'janela'`).
 * Cliques simples são ignorados (uma janela precisa de dois cantos).
 * `regiaoAtual` é o retângulo em andamento, para passar em `PixelGrid.regiaoSelecao`.
 */
import { useState } from 'react';
import type { Retangulo } from '../core/tipos';
import type { Ferramenta } from './tipos';

export interface OpcoesFerramentaJanela {
  aoDefinir(r: Retangulo): void;
  aoMover?(r: Retangulo): void;
}

export interface FerramentaJanela extends Ferramenta {
  regiaoAtual: Retangulo | null;
}

export function useFerramentaJanela({ aoDefinir, aoMover }: OpcoesFerramentaJanela): FerramentaJanela {
  const [regiao, setRegiao] = useState<Retangulo | null>(null);

  return {
    instrucao: 'Arraste na grade para definir a janela de recorte',
    overlays: [],
    modoArrasto: 'janela',
    regiaoAtual: regiao,
    aoClicarCelula() {
      setRegiao(null);
    },
    aoArrastoMover(r) {
      setRegiao(r);
      aoMover?.(r);
    },
    aoArrastoFim(r) {
      setRegiao(null);
      aoDefinir(r);
    },
    cancelar() {
      setRegiao(null);
    },
  };
}
