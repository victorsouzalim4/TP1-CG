/**
 * Ferramenta "circunferência": 1º clique fixa o centro; o preview mostra a circunferência ideal
 * com r = round(distância(centro, hover)); 2º clique fixa o raio (r >= 0) e chama `aoConcluir`.
 */
import { useState } from 'react';
import type { Overlay, Ponto } from '../core/tipos';
import { distancia } from '../core/geometria';
import { mesmoPonto, type Ferramenta } from './tipos';

export interface OpcoesFerramentaCirculo {
  hover: Ponto | null;
  cor: string;
  aoConcluir(centro: Ponto, raio: number): void;
}

export interface FerramentaCirculo extends Ferramenta {
  centro: Ponto | null;
  /** Raio do preview (arredondado) enquanto o mouse se move; `null` sem centro ou sem hover. */
  raioPreview: number | null;
}

export function useFerramentaCirculo({ hover, cor, aoConcluir }: OpcoesFerramentaCirculo): FerramentaCirculo {
  const [centro, setCentro] = useState<Ponto | null>(null);
  const raioPreview = centro && hover ? Math.round(distancia(centro, hover)) : null;

  const overlays: Overlay[] = [];
  if (centro) {
    overlays.push({ tipo: 'celula', x: centro.x, y: centro.y, cor, estilo: 'preenchido', rotulo: 'C' });
    if (hover && raioPreview !== null) {
      overlays.push({ tipo: 'circulo-ideal', xc: centro.x, yc: centro.y, r: raioPreview, cor, tracejado: true });
      if (!mesmoPonto(hover, centro)) {
        overlays.push({ tipo: 'segmento', x1: centro.x, y1: centro.y, x2: hover.x, y2: hover.y, cor, tracejado: true, opacidade: 0.6 });
      }
      overlays.push({ tipo: 'celula', x: hover.x, y: hover.y, cor, estilo: 'contorno', rotulo: `r = ${raioPreview}` });
    }
  }

  return {
    instrucao: centro ? 'Clique num ponto da circunferência para definir o raio' : 'Clique no centro C',
    overlays,
    modoArrasto: 'nenhum',
    centro,
    raioPreview,
    aoClicarCelula(p) {
      if (!centro) {
        setCentro(p);
        return;
      }
      aoConcluir(centro, Math.round(distancia(centro, p)));
      setCentro(null);
    },
    cancelar() {
      setCentro(null);
    },
  };
}
