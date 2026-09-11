import { describe, expect, it } from 'vitest';
import {
  aplicarPonto,
  compor,
  escala,
  identidade,
  multiplicar,
  paraValor,
  reflexaoX,
  reflexaoXY,
  reflexaoY,
  rotacao,
  translacao,
} from '../../src/core/matriz';
import type { Matriz3 } from '../../src/core/tipos';

function proximo(a: Matriz3, b: Matriz3) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(a[i][j]).toBeCloseTo(b[i][j], 9);
}

describe('matriz', () => {
  it('identidade é neutra', () => {
    const M = compor(translacao(3, -2), rotacao(30), escala(2, 0.5));
    proximo(multiplicar(identidade(), M), M);
    proximo(multiplicar(M, identidade()), M);
    expect(compor()).toEqual(identidade());
  });

  it('multiplicação é associativa', () => {
    const A = translacao(1, 2);
    const B = rotacao(45);
    const C = escala(2, 3);
    proximo(multiplicar(multiplicar(A, B), C), multiplicar(A, multiplicar(B, C)));
    proximo(compor(A, B, C), multiplicar(A, multiplicar(B, C)));
  });

  it('T·R ≠ R·T', () => {
    const T = translacao(5, 0);
    const R = rotacao(90);
    const p = { x: 1, y: 0 };
    const tr = aplicarPonto(multiplicar(T, R), p); // primeiro R, depois T → (5, 1)
    const rt = aplicarPonto(multiplicar(R, T), p); // primeiro T, depois R → (0, 6)
    expect(tr.x).toBeCloseTo(5, 9);
    expect(tr.y).toBeCloseTo(1, 9);
    expect(rt.x).toBeCloseTo(0, 9);
    expect(rt.y).toBeCloseTo(6, 9);
  });

  it('rotacao(90) leva (1,0) em (0,1)', () => {
    const p = aplicarPonto(rotacao(90), { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });

  it('translacao e escala', () => {
    expect(aplicarPonto(translacao(2, -3), { x: 1, y: 1 })).toEqual({ x: 3, y: -2 });
    expect(aplicarPonto(escala(2, 3), { x: 1, y: 1 })).toEqual({ x: 2, y: 3 });
  });

  it('reflexões de (2,3)', () => {
    expect(aplicarPonto(reflexaoX(), { x: 2, y: 3 })).toEqual({ x: 2, y: -3 });
    expect(aplicarPonto(reflexaoY(), { x: 2, y: 3 })).toEqual({ x: -2, y: 3 });
    expect(aplicarPonto(reflexaoXY(), { x: 2, y: 3 })).toEqual({ x: -2, y: -3 });
  });

  it('rotação de 180° em torno do pivô (1,1): (2,1) → (0,1)', () => {
    const M = compor(translacao(1, 1), rotacao(180), translacao(-1, -1));
    const p = aplicarPonto(M, { x: 2, y: 1 });
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });

  it('paraValor limpa ruído e arredonda a 4 casas', () => {
    const valor = paraValor(rotacao(90), 'R');
    expect(valor).toEqual({ tipo: 'matriz', linhas: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], rotulo: 'R' });
    const v45 = paraValor(rotacao(45));
    if (typeof v45 === 'object' && v45 !== null && 'tipo' in v45 && v45.tipo === 'matriz') {
      expect(v45.linhas[0][0]).toBe(0.7071);
      expect(v45.rotulo).toBeUndefined();
    } else {
      throw new Error('esperava Valor do tipo matriz');
    }
  });
});
