/**
 * Ferramenta "reta": 1º clique fixa P1 (célula preenchida + segmento tracejado até o hover);
 * 2º clique define P2, chama `aoConcluir(p1, p2)` e reinicia.
 */
import { useState } from 'react';
import type { Overlay, Ponto } from '../core/tipos';
import { mesmoPonto, type Ferramenta } from './tipos';

export interface OpcoesFerramentaReta {
  hover: Ponto | null;
  cor: string;
  aoConcluir(p1: Ponto, p2: Ponto): void;
}

export interface FerramentaReta extends Ferramenta {
  /** Ponto inicial já fixado (ou `null`). */
  p1: Ponto | null;
}

export function useFerramentaReta({ hover, cor, aoConcluir }: OpcoesFerramentaReta): FerramentaReta {
  const [p1, setP1] = useState<Ponto | null>(null);

  const overlays: Overlay[] = [];
  if (p1) {
    overlays.push({ tipo: 'celula', x: p1.x, y: p1.y, cor, estilo: 'preenchido', rotulo: 'P1' });
    if (hover && !mesmoPonto(hover, p1)) {
      overlays.push({ tipo: 'segmento', x1: p1.x, y1: p1.y, x2: hover.x, y2: hover.y, cor, tracejado: true, opacidade: 0.7 });
      overlays.push({ tipo: 'celula', x: hover.x, y: hover.y, cor, estilo: 'contorno', rotulo: 'P2' });
    }
  }

  return {
    instrucao: p1 ? 'Clique no ponto final P2' : 'Clique no ponto inicial P1',
    overlays,
    modoArrasto: 'nenhum',
    p1,
    aoClicarCelula(p) {
      if (!p1) {
        setP1(p);
        return;
      }
      aoConcluir(p1, p);
      setP1(null);
    },
    cancelar() {
      setP1(null);
    },
  };
}
