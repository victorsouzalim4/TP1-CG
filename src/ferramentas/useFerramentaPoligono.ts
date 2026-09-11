/**
 * Ferramenta "polígono": cada clique adiciona um vértice (preview do polígono aberto + aresta
 * tracejada até o hover). Com >= 3 vértices, clicar no 1º vértice (ou chamar `fechar()`)
 * conclui e chama `aoConcluir(vertices)`.
 */
import { useState } from 'react';
import type { Overlay, Ponto } from '../core/tipos';
import { COR_OVERLAY } from '../core/cores';
import { mesmoPonto, type Ferramenta } from './tipos';

export interface OpcoesFerramentaPoligono {
  hover: Ponto | null;
  cor: string;
  aoConcluir(vertices: Ponto[]): void;
}

export interface FerramentaPoligono extends Ferramenta {
  verticesAtuais: Ponto[];
  /** `true` quando há vértices suficientes (>= 3) para fechar. */
  podeFechar: boolean;
  /** Fecha o polígono (equivale a clicar no 1º vértice). Sem efeito se `!podeFechar`. */
  fechar(): void;
}

export function useFerramentaPoligono({ hover, cor, aoConcluir }: OpcoesFerramentaPoligono): FerramentaPoligono {
  const [vertices, setVertices] = useState<Ponto[]>([]);
  const podeFechar = vertices.length >= 3;
  const ultimo = vertices.length > 0 ? vertices[vertices.length - 1] : null;

  const overlays: Overlay[] = [];
  if (vertices.length > 1) {
    overlays.push({ tipo: 'poligono-ideal', vertices, cor, fechado: false });
  }
  vertices.forEach((v, i) => {
    overlays.push({ tipo: 'celula', x: v.x, y: v.y, cor, estilo: 'preenchido', rotulo: `V${i + 1}` });
  });
  if (podeFechar) {
    // Dica visual: o 1º vértice fica destacado para indicar que clicar nele fecha o polígono.
    overlays.push({ tipo: 'celula', x: vertices[0].x, y: vertices[0].y, cor: COR_OVERLAY.destaque, estilo: 'contorno' });
  }
  if (hover && ultimo && !mesmoPonto(hover, ultimo)) {
    overlays.push({ tipo: 'segmento', x1: ultimo.x, y1: ultimo.y, x2: hover.x, y2: hover.y, cor, tracejado: true, opacidade: 0.7 });
  }

  function concluir(): void {
    aoConcluir(vertices);
    setVertices([]);
  }

  let instrucao: string;
  if (vertices.length === 0) instrucao = 'Clique no 1º vértice do polígono';
  else if (!podeFechar) instrucao = `Clique no próximo vértice (${vertices.length} de no mínimo 3)`;
  else instrucao = `Clique no próximo vértice, ou em V1 / "Fechar polígono" para concluir (${vertices.length} vértices)`;

  return {
    instrucao,
    overlays,
    modoArrasto: 'nenhum',
    verticesAtuais: vertices,
    podeFechar,
    aoClicarCelula(p) {
      if (podeFechar && mesmoPonto(p, vertices[0])) {
        concluir();
        return;
      }
      if (ultimo && mesmoPonto(p, ultimo)) return; // ignora clique repetido no mesmo vértice
      setVertices([...vertices, p]);
    },
    fechar() {
      if (podeFechar) concluir();
    },
    cancelar() {
      setVertices([]);
    },
  };
}
