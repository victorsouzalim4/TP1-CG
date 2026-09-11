/**
 * Tipos e utilitários compartilhados pelos algoritmos de preenchimento (Boundary Fill e
 * Flood Fill) — slides "CG 08 Preenchimento".
 */
import type { Pixel, Ponto, Valor } from '../tipos';
import type { MatrizPixels } from '../matrizPixels';

export interface ParametrosPreenchimento {
  /** Semente (ponto inicial do preenchimento). */
  x: number;
  y: number;
  /** Cor com que se pinta. */
  corPreenche: string;
  /** Cor da fronteira (só o Boundary Fill usa). */
  corContorno?: string;
  /** Vizinhança usada na expansão. */
  conectividade: 4 | 8;
  /** Matriz de pixels da cena (o algoritmo trabalha sobre uma cópia). */
  matriz: MatrizPixels;
}

export interface ResultadoPreenchimento {
  pixels: Pixel[];
  /** Quantidade de pixels pintados. */
  total: number;
}

/**
 * Vizinhos de (x, y) na ordem em que os slides os visitam: direita, esquerda, cima, baixo e,
 * na conectividade 8, as quatro diagonais (NE, NO, SE, SO).
 */
export function vizinhos(x: number, y: number, conectividade: 4 | 8): Ponto[] {
  const lista: Ponto[] = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
  if (conectividade === 8) {
    lista.push({ x: x + 1, y: y + 1 }, { x: x - 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y - 1 });
  }
  return lista;
}

/**
 * Snapshot da pilha para o painel de variáveis: só os `topoN` elementos do topo são enviados
 * (a pilha pode ter milhares de itens), com `topo[0]` sendo o topo da pilha.
 * `pilha` segue a convenção de array JS: o último elemento é o topo.
 */
export function snapshotPilha(pilha: readonly Ponto[], topoN = 8): Valor {
  const topo: Valor[] = [];
  for (let i = pilha.length - 1; i >= 0 && topo.length < topoN; i--) {
    topo.push({ tipo: 'ponto', x: pilha[i].x, y: pilha[i].y });
  }
  return { tipo: 'pilha', topo, tamanho: pilha.length };
}
