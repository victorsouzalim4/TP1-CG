import { describe, expect, it } from 'vitest';
import { algoritmoDDA } from '../../../src/core/rasterizacao/dda';
import { coletarPixels } from '../../../src/core/rasterizacao/rasterizar';
import { contarLinhas, type Passo } from '../../../src/core/tipos';

function pixelsDDA(x1: number, y1: number, x2: number, y2: number) {
  return coletarPixels(algoritmoDDA.executar({ x1, y1, x2, y2 })).pixels.map((p) => [p.x, p.y]);
}

function passosDDA(x1: number, y1: number, x2: number, y2: number): Passo[] {
  return [...algoritmoDDA.executar({ x1, y1, x2, y2 })];
}

const chave = (p: number[]) => `${p[0]},${p[1]}`;

describe('DDA', () => {
  it('reta horizontal (0,0)→(5,0): 6 pixels em ordem', () => {
    expect(pixelsDDA(0, 0, 5, 0)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);
  });

  it('diagonal (0,0)→(4,4)', () => {
    expect(pixelsDDA(0, 0, 4, 4)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
  });

  it('vertical (2,0)→(2,6)', () => {
    expect(pixelsDDA(2, 0, 2, 6)).toEqual([
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4],
      [2, 5],
      [2, 6],
    ]);
  });

  it('(5,0)→(0,0) produz o mesmo conjunto que (0,0)→(5,0)', () => {
    const direto = new Set(pixelsDDA(0, 0, 5, 0).map(chave));
    const inverso = new Set(pixelsDDA(5, 0, 0, 0).map(chave));
    expect(inverso).toEqual(direto);
  });

  it('P1 = P2 pinta um único pixel', () => {
    expect(pixelsDDA(3, 3, 3, 3)).toEqual([[3, 3]]);
  });

  it('reta inclinada: extremos corretos e um pixel por coluna', () => {
    const px = pixelsDDA(0, 0, 10, 3);
    expect(px[0]).toEqual([0, 0]);
    expect(px[px.length - 1]).toEqual([10, 3]);
    expect(px).toHaveLength(11);
  });

  it('todas as linhas dos passos estão dentro da listagem', () => {
    const total = contarLinhas(algoritmoDDA.codigo);
    expect(total).toBe(14);
    for (const p of [...passosDDA(0, 0, 7, 3), ...passosDDA(2, 2, 2, 2)]) {
      expect(p.linha).toBeGreaterThanOrEqual(1);
      expect(p.linha).toBeLessThanOrEqual(total);
    }
  });

  it('snapshot de variáveis é completo e na ordem de declaração', () => {
    const passos = passosDDA(0, 0, 4, 2);
    const ultimo = passos[passos.length - 1];
    expect(Object.keys(ultimo.variaveis)).toEqual([
      'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'passos', 'x_incr', 'y_incr', 'x', 'y', 'k',
    ]);
    expect(ultimo.variaveis.x_incr).toBe(1);
    expect(ultimo.variaveis.y_incr).toBe(0.5);
    expect(ultimo.variaveis.k).toBe(4);
  });
});
