import { describe, expect, it } from 'vitest';
import {
  criarCirculo,
  criarPoligono,
  criarPonto,
  criarPreenchimento,
  criarReta,
} from '../../../src/core/cena/objetos';
import { aplicarSelecao, objetosNaRegiao } from '../../../src/core/cena/selecao';

const COR = '#111827';
const regiao = { xmin: 0, ymin: 0, xmax: 10, ymax: 10 };

describe('seleção por região', () => {
  it('seleciona objetos com todos os vértices dentro (limites inclusivos)', () => {
    const ponto = criarPonto({ x: 10, y: 10 }, COR);
    const reta = criarReta({ x: 0, y: 0 }, { x: 5, y: 5 }, COR);
    const poligono = criarPoligono([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 5, y: 9 }], COR);
    expect(objetosNaRegiao([ponto, reta, poligono], regiao)).toEqual([ponto.id, reta.id, poligono.id]);
  });

  it('objeto parcialmente dentro não é selecionado', () => {
    const reta = criarReta({ x: 2, y: 2 }, { x: 12, y: 2 }, COR);
    const poligono = criarPoligono([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 5, y: 11 }], COR);
    expect(objetosNaRegiao([reta, poligono], regiao)).toEqual([]);
  });

  it('vértices reais são comparados sem arredondar', () => {
    const fora = criarPonto({ x: 10.2, y: 5 }, COR);
    const dentro = criarPonto({ x: 9.8, y: 5 }, COR);
    expect(objetosNaRegiao([fora, dentro], regiao)).toEqual([dentro.id]);
  });

  it('circunferência usa apenas o centro', () => {
    const c = criarCirculo({ x: 9, y: 9 }, 5, COR); // extrapola a região, mas o centro está dentro
    expect(objetosNaRegiao([c], regiao)).toEqual([c.id]);
    const foraDoCentro = criarCirculo({ x: 11, y: 5 }, 1, COR);
    expect(objetosNaRegiao([foraDoCentro], regiao)).toEqual([]);
  });

  it('preenchimento nunca é selecionado', () => {
    const fill = criarPreenchimento([{ x: 1, y: 1 }, { x: 2, y: 2 }], COR);
    expect(objetosNaRegiao([fill], regiao)).toEqual([]);
  });

  it('aplicarSelecao marca só os ids informados', () => {
    const a = criarReta({ x: 0, y: 0 }, { x: 1, y: 1 }, COR);
    const b = criarReta({ x: 0, y: 0 }, { x: 2, y: 2 }, COR);
    const resultado = aplicarSelecao([a, b], [b.id]);
    expect(resultado.map((o) => o.selecionado)).toEqual([false, true]);
    // Objeto cujo estado não mudou é a mesma referência (evita re-render desnecessário).
    expect(resultado[0]).toBe(a);
  });
});
