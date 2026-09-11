import { describe, expect, it } from 'vitest';
import { algoritmoBresenhamCirculo } from '../../../src/core/rasterizacao/bresenhamCirculo';
import { coletarPixels } from '../../../src/core/rasterizacao/rasterizar';
import { contarLinhas } from '../../../src/core/tipos';

function unicos(xc: number, yc: number, r: number) {
  const { pixels } = coletarPixels(algoritmoBresenhamCirculo.executar({ xc, yc, r }));
  return new Set(pixels.map((p) => `${p.x},${p.y}`));
}

describe('Bresenham (circunferência)', () => {
  it('r = 5: sequência (x, y, p) a cada plot_circle_points', () => {
    const plots = [...algoritmoBresenhamCirculo.executar({ xc: 0, yc: 0, r: 5 })]
      .filter((p) => (p.pixels?.length ?? 0) > 0)
      .map((p) => [p.variaveis.x, p.variaveis.y, p.variaveis.p]);
    expect(plots).toEqual([
      [0, 5, -7],
      [1, 5, -1],
      [2, 5, 9],
      [3, 4, 7],
      [4, 3, 13],
    ]);
  });

  it('r = 5: 28 pixels únicos', () => {
    expect(unicos(0, 0, 5).size).toBe(28);
  });

  it('r = 5: cada plot emite 8 pixels rotulados de 1 a 8', () => {
    const plot = [...algoritmoBresenhamCirculo.executar({ xc: 0, yc: 0, r: 5 })].find((p) => p.pixels);
    expect(plot?.pixels).toHaveLength(8);
    const rotulos = (plot?.overlays ?? [])
      .filter((o) => o.tipo === 'celula')
      .map((o) => (o.tipo === 'celula' ? o.rotulo : undefined));
    expect(rotulos).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('simetria nos 8 octantes em torno de um centro qualquer', () => {
    const xc = 10;
    const yc = 7;
    const conjunto = unicos(xc, yc, 6);
    for (const chave of conjunto) {
      const [x, y] = chave.split(',').map(Number);
      const dx = x - xc;
      const dy = y - yc;
      const simetricos = [
        [dx, dy], [-dx, dy], [dx, -dy], [-dx, -dy], [dy, dx], [-dy, dx], [dy, -dx], [-dy, -dx],
      ];
      for (const [sx, sy] of simetricos) expect(conjunto.has(`${xc + sx},${yc + sy}`)).toBe(true);
    }
  });

  it('r = 0 → 1 pixel único; r = 1 → 4 pixels únicos', () => {
    expect(unicos(3, 3, 0).size).toBe(1);
    expect(unicos(3, 3, 0).has('3,3')).toBe(true);
    expect(unicos(3, 3, 1).size).toBe(4);
  });

  it('todas as linhas dos passos estão dentro da listagem', () => {
    const total = contarLinhas(algoritmoBresenhamCirculo.codigo);
    for (const p of algoritmoBresenhamCirculo.executar({ xc: 0, yc: 0, r: 4 })) {
      expect(p.linha).toBeGreaterThanOrEqual(1);
      expect(p.linha).toBeLessThanOrEqual(total);
    }
  });

  it('todos os passos trazem a circunferência ideal como overlay', () => {
    for (const p of algoritmoBresenhamCirculo.executar({ xc: 2, yc: 2, r: 3 })) {
      expect(p.overlays?.some((o) => o.tipo === 'circulo-ideal')).toBe(true);
    }
  });
});
