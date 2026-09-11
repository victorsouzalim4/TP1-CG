import { describe, expect, it } from 'vitest';
import { algoritmoBresenhamReta } from '../../../src/core/rasterizacao/bresenhamReta';
import { algoritmoDDA } from '../../../src/core/rasterizacao/dda';
import { coletarPixels } from '../../../src/core/rasterizacao/rasterizar';
import { contarLinhas } from '../../../src/core/tipos';

function bresenham(x1: number, y1: number, x2: number, y2: number) {
  return coletarPixels(algoritmoBresenhamReta.executar({ x1, y1, x2, y2 })).pixels.map((p) => [p.x, p.y]);
}

function dda(x1: number, y1: number, x2: number, y2: number) {
  return coletarPixels(algoritmoDDA.executar({ x1, y1, x2, y2 })).pixels.map((p) => [p.x, p.y]);
}

describe('Bresenham (reta)', () => {
  it('reproduz o exemplo do slide: (20,10)→(30,18)', () => {
    expect(bresenham(20, 10, 30, 18)).toEqual([
      [20, 10],
      [21, 11],
      [22, 12],
      [23, 12],
      [24, 13],
      [25, 14],
      [26, 15],
      [27, 16],
      [28, 16],
      [29, 17],
      [30, 18],
    ]);
  });

  it('horizontal, vertical e 45°', () => {
    expect(bresenham(0, 0, 4, 0)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]);
    expect(bresenham(1, 0, 1, 3)).toEqual([[1, 0], [1, 1], [1, 2], [1, 3]]);
    expect(bresenham(0, 0, 3, 3)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
  });

  it('P1 = P2 pinta um único pixel', () => {
    expect(bresenham(5, 5, 5, 5)).toEqual([[5, 5]]);
  });

  it('todos os 8 octantes: max(|dx|,|dy|)+1 pixels, extremos exatos, passo unitário', () => {
    const destinos = [
      [7, 3], [3, 7], [-3, 7], [-7, 3], [-7, -3], [-3, -7], [3, -7], [7, -3],
    ];
    for (const [dx, dy] of destinos) {
      const px = bresenham(0, 0, dx, dy);
      expect(px).toHaveLength(Math.max(Math.abs(dx), Math.abs(dy)) + 1);
      expect(px[0]).toEqual([0, 0]);
      expect(px[px.length - 1]).toEqual([dx, dy]);
      // Pixels consecutivos são vizinhos (8-conectados) e sem repetição.
      for (let i = 1; i < px.length; i++) {
        expect(Math.abs(px[i][0] - px[i - 1][0])).toBeLessThanOrEqual(1);
        expect(Math.abs(px[i][1] - px[i - 1][1])).toBeLessThanOrEqual(1);
        expect(px[i]).not.toEqual(px[i - 1]);
      }
    }
  });

  it('coincide com o DDA em retas nos eixos e a 45°', () => {
    expect(bresenham(0, 0, 6, 0)).toEqual(dda(0, 0, 6, 0));
    expect(bresenham(0, 0, 0, 6)).toEqual(dda(0, 0, 0, 6));
    expect(bresenham(0, 0, 5, 5)).toEqual(dda(0, 0, 5, 5));
    expect(bresenham(5, 5, 0, 0)).toEqual(dda(5, 5, 0, 0));
  });

  it('todas as linhas dos passos estão dentro da listagem', () => {
    const total = contarLinhas(algoritmoBresenhamReta.codigo);
    const casos = [
      [0, 0, 7, 3],
      [0, 0, 3, 7],
      [4, 4, 4, 4],
    ];
    for (const [x1, y1, x2, y2] of casos) {
      for (const p of algoritmoBresenhamReta.executar({ x1, y1, x2, y2 })) {
        expect(p.linha).toBeGreaterThanOrEqual(1);
        expect(p.linha).toBeLessThanOrEqual(total);
      }
    }
  });

  it('mantém os nomes das variáveis dos slides', () => {
    const passos = [...algoritmoBresenhamReta.executar({ x1: 0, y1: 0, x2: 5, y2: 2 })];
    const ultimo = passos[passos.length - 1];
    expect(Object.keys(ultimo.variaveis)).toEqual([
      'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'incrx', 'incry', 'x', 'y', 'p', 'const1', 'const2', 'i',
    ]);
  });
});
