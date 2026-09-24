import { describe, expect, it } from 'vitest';
import { montarMatriz } from '../../../src/core/transformacoes/montarMatriz';
import { aplicarPonto, compor, escala, reflexaoXY, rotacao, translacao } from '../../../src/core/matriz';
import type { Matriz3, Ponto } from '../../../src/core/tipos';

function proximo(a: Matriz3, b: Matriz3) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(a[i][j]).toBeCloseTo(b[i][j], 9);
}

function pontoProximo(a: Ponto, b: Ponto) {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
}

describe('montarMatriz', () => {
  it('rotação com pivô = T(p)·R(θ)·T(−p)', () => {
    const p = { x: 3, y: 2 };
    const r = montarMatriz({ tipo: 'rotacao', angulo: 30 }, p);
    proximo(r.matriz, compor(translacao(3, 2), rotacao(30), translacao(-3, -2)));
    expect(r.composicao.map((f) => f.rotulo)).toEqual(['T(3, 2)', 'R(30°)', 'T(-3, -2)']);
    proximo(r.composicao[0].matriz, translacao(3, 2));
    proximo(r.composicao[1].matriz, rotacao(30));
    proximo(r.composicao[2].matriz, translacao(-3, -2));
    expect(r.expressao).toBe('T(3, 2) · R(30°) · T(-3, -2)');
    // O pivô é ponto fixo.
    pontoProximo(aplicarPonto(r.matriz, p), p);
  });

  it('R(180°) com pivô (1,1) leva (2,1) a (0,1)', () => {
    const r = montarMatriz({ tipo: 'rotacao', angulo: 180 }, { x: 1, y: 1 });
    expect(aplicarPonto(r.matriz, { x: 2, y: 1 })).toEqual({ x: 0, y: 1 });
  });

  it('pivô na origem dispensa os T', () => {
    const r = montarMatriz({ tipo: 'escala', sx: 2, sy: 0.5 }, { x: 0, y: 0 });
    expect(r.composicao.map((f) => f.rotulo)).toEqual(['S(2, 0.5)']);
    proximo(r.matriz, escala(2, 0.5));
    expect(r.fatores).toMatchObject({ sx: 2, sy: 0.5 });
  });

  it('translação ignora o pivô', () => {
    const r = montarMatriz({ tipo: 'translacao', tx: -4, ty: 7 }, { x: 5, y: 5 });
    expect(r.composicao.map((f) => f.rotulo)).toEqual(['T(-4, 7)']);
    proximo(r.matriz, translacao(-4, 7));
    expect(r.fatores).toEqual({ tx: -4, ty: 7 });
  });

  it('fatores da rotação: θ, cos θ, sin θ', () => {
    const r = montarMatriz({ tipo: 'rotacao', angulo: 90 }, { x: 0, y: 0 });
    expect(r.fatores).toMatchObject({ θ: '90°', 'cos θ': 0, 'sin θ': 1 });
  });

  it('escala 2 com pivô mantém o pivô fixo e dobra a distância', () => {
    const r = montarMatriz({ tipo: 'escala', sx: 2, sy: 2 }, { x: 1, y: 1 });
    expect(aplicarPonto(r.matriz, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
    expect(aplicarPonto(r.matriz, { x: 3, y: 2 })).toEqual({ x: 5, y: 3 });
  });

  it('reflexões X, Y e XY em torno da origem', () => {
    expect(aplicarPonto(montarMatriz({ tipo: 'reflexao', eixo: 'x' }, { x: 0, y: 0 }).matriz, { x: 2, y: 3 })).toEqual({ x: 2, y: -3 });
    expect(aplicarPonto(montarMatriz({ tipo: 'reflexao', eixo: 'y' }, { x: 0, y: 0 }).matriz, { x: 2, y: 3 })).toEqual({ x: -2, y: 3 });
    const xy = montarMatriz({ tipo: 'reflexao', eixo: 'xy' }, { x: 0, y: 0 });
    proximo(xy.matriz, reflexaoXY());
    expect(xy.composicao[0].rotulo).toBe('Ref(XY)');
  });

  it('reflexão X com pivô reflete em torno da reta y = py', () => {
    const r = montarMatriz({ tipo: 'reflexao', eixo: 'x' }, { x: 0, y: 2 });
    expect(aplicarPonto(r.matriz, { x: 5, y: 3 })).toEqual({ x: 5, y: 1 });
  });
});
