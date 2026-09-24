import { describe, expect, it } from 'vitest';
import {
  algoritmoTransformacao,
  CODIGO_TRANSFORMACAO,
  type ParametrosTransformacao,
  type ResultadoTransformacao,
} from '../../../src/core/transformacoes/transformar';
import { montarMatriz, type Transformacao } from '../../../src/core/transformacoes/montarMatriz';
import { criarCirculo, criarPoligono, criarReta, type ObjetoGrafico } from '../../../src/core/cena/objetos';
import { rasterizarObjeto } from '../../../src/core/rasterizacao/rasterizar';
import { contarLinhas, type Passo, type Ponto } from '../../../src/core/tipos';

const COR = '#dc2626';

function params(objetos: ObjetoGrafico[], t: Transformacao, pivo: Ponto): ParametrosTransformacao {
  const m = montarMatriz(t, pivo);
  return { objetos, matriz: m.matriz, composicao: m.composicao, fatores: m.fatores, pivo };
}

function executar(p: ParametrosTransformacao): { passos: Passo[]; resultado: ResultadoTransformacao } {
  const gen = algoritmoTransformacao.executar(p);
  const passos: Passo[] = [];
  let r = gen.next();
  while (!r.done) {
    passos.push(r.value);
    r = gen.next();
  }
  return { passos, resultado: r.value };
}

describe('algoritmoTransformacao', () => {
  it('triângulo: vértices transformados e pixels finais (rotação 90° no centroide)', () => {
    const tri = criarPoligono([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 3 }], COR);
    const { passos, resultado } = executar(params([tri], { tipo: 'rotacao', angulo: 90 }, { x: 1, y: 1 }));

    const novo = resultado.objetos[0];
    expect(novo.id).toBe(tri.id);
    expect(novo.tipo).toBe('poligono');
    if (novo.tipo !== 'poligono') throw new Error('tipo');
    // (x, y) → (1 − (y − 1), 1 + (x − 1)) = (2 − y, x)
    expect(novo.vertices).toEqual([{ x: 2, y: 0 }, { x: 2, y: 3 }, { x: -1, y: 0 }]);

    const esperados = rasterizarObjeto(novo);
    expect(resultado.pixels).toEqual(esperados);
    // Os pixels só aparecem no passo de rasterizar (linha 8) e todos têm a cor do objeto.
    const comPixels = passos.filter((p) => p.pixels && p.pixels.length > 0);
    expect(comPixels.map((p) => p.linha)).toEqual([8]);
    expect(comPixels[0].pixels).toEqual(esperados);
    expect(esperados.every((px) => px.cor === COR)).toBe(true);
  });

  it('um passo por linha: 1, 2, (3, 4, 5, 6) por vértice e 8', () => {
    const tri = criarPoligono([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }], COR);
    const { passos } = executar(params([tri], { tipo: 'translacao', tx: 2, ty: 1 }, { x: 0, y: 0 }));
    expect(passos.map((p) => p.linha)).toEqual([1, 2, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6, 8]);
    const total = contarLinhas(CODIGO_TRANSFORMACAO);
    for (const p of passos) {
      expect(p.linha).toBeGreaterThanOrEqual(1);
      expect(p.linha).toBeLessThanOrEqual(total);
      expect(() => JSON.stringify(p.variaveis)).not.toThrow();
    }
  });

  it("variáveis: M, fatores da composição, tx/ty, P, x', y', P' e seta P → P'", () => {
    const reta = criarReta({ x: 1, y: 2 }, { x: 5, y: 2 }, COR);
    const { passos, resultado } = executar(params([reta], { tipo: 'translacao', tx: 2, ty: 1 }, { x: 0, y: 0 }));
    const p6 = passos.find((p) => p.linha === 6)!;
    expect(p6.variaveis.M).toEqual({ tipo: 'matriz', linhas: [[1, 0, 2], [0, 1, 1], [0, 0, 1]], rotulo: 'M' });
    expect(p6.variaveis['T(2, 1)']).toMatchObject({ tipo: 'matriz' });
    expect(p6.variaveis.tx).toBe(2);
    expect(p6.variaveis.ty).toBe(1);
    expect(p6.variaveis.P).toEqual({ tipo: 'matriz', linhas: [[1], [2], [1]], rotulo: 'P' });
    expect(p6.variaveis["x'"]).toBe(3);
    expect(p6.variaveis["y'"]).toBe(3);
    expect(p6.variaveis["P'"]).toEqual({ tipo: 'matriz', linhas: [[3], [3], [1]], rotulo: "P'" });
    expect(p6.overlays).toContainEqual({ tipo: 'seta', de: { x: 1, y: 2 }, para: { x: 3, y: 3 }, cor: expect.any(String) });
    // Forma original tracejada em todos os passos.
    for (const p of passos) {
      expect(p.overlays).toContainEqual(expect.objectContaining({ tipo: 'segmento', x1: 1, y1: 2, x2: 5, y2: 2, tracejado: true }));
    }
    const nova = resultado.objetos[0];
    expect(nova.tipo === 'reta' && [nova.p1, nova.p2]).toEqual([{ x: 3, y: 3 }, { x: 7, y: 3 }]);
  });

  it('rotação exibe θ, cos θ e sin θ', () => {
    const tri = criarPoligono([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 3 }], COR);
    const { passos } = executar(params([tri], { tipo: 'rotacao', angulo: 90 }, { x: 1, y: 1 }));
    expect(passos[0].variaveis).toMatchObject({ θ: '90°', 'cos θ': 0, 'sin θ': 1 });
    expect(Object.keys(passos[0].variaveis)).toEqual(expect.arrayContaining(['M', 'T(1, 1)', 'R(90°)', 'T(-1, -1)']));
  });

  it('circunferência com escala não uniforme é pulada com aviso', () => {
    const c = criarCirculo({ x: 2, y: 2 }, 3, COR);
    const { passos, resultado } = executar(params([c], { tipo: 'escala', sx: 2, sy: 1 }, { x: 0, y: 0 }));
    expect(resultado.objetos[0]).toEqual(c);
    const ultimo = passos[passos.length - 1];
    expect(ultimo.descricao).toMatch(/não uniforme/);
    expect(ultimo.pixels).toEqual(rasterizarObjeto(c));
    expect(passos.some((p) => p.linha === 3)).toBe(false);
  });

  it('circunferência com escala uniforme tem centro e raio escalados', () => {
    const c = criarCirculo({ x: 2, y: 1 }, 3, COR);
    const { resultado } = executar(params([c], { tipo: 'escala', sx: 2, sy: 2 }, { x: 0, y: 0 }));
    expect(resultado.objetos[0]).toMatchObject({ centro: { x: 4, y: 2 }, raio: 6 });
  });

  it('vários objetos: resultado na mesma ordem e com os mesmos ids', () => {
    const a = criarReta({ x: 0, y: 0 }, { x: 2, y: 0 }, COR);
    const b = criarPoligono([{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 3 }], COR);
    const { resultado } = executar(params([a, b], { tipo: 'reflexao', eixo: 'xy' }, { x: 0, y: 0 }));
    expect(resultado.objetos.map((o) => o.id)).toEqual([a.id, b.id]);
    expect(resultado.objetos[1]).toMatchObject({ vertices: [{ x: -1, y: -1 }, { x: -3, y: -1 }, { x: -2, y: -3 }] });
  });
});
