import { describe, expect, it } from 'vitest';
import { algoritmoLiangBarsky, type ResultadoRecorte } from '../../../src/core/recorte/liangBarsky';
import { contarLinhas, type Passo, type Retangulo, type Valor } from '../../../src/core/tipos';

/** Janela dos slides: x ∈ [0, 6], y ∈ [0, 5]. */
const JANELA: Retangulo = { xmin: 0, ymin: 0, xmax: 6, ymax: 5 };

function executar(x1: number, y1: number, x2: number, y2: number, janela = JANELA): { passos: Passo[]; resultado: ResultadoRecorte } {
  const gen = algoritmoLiangBarsky.executar({ x1, y1, x2, y2, janela });
  const passos: Passo[] = [];
  let r = gen.next();
  while (!r.done) {
    passos.push(r.value);
    r = gen.next();
  }
  return { passos, resultado: r.value };
}

function ultimo(passos: Passo[]): Passo {
  return passos[passos.length - 1];
}

function tabela(p: Passo): Valor[][] {
  const t = p.variaveis.tabela;
  if (t === null || typeof t !== 'object' || t.tipo !== 'tabela') throw new Error('sem tabela');
  expect(t.colunas).toEqual(['k', 'p_k', 'q_k', 'r_k', 'u1', 'u2', 'resultado']);
  return t.linhas;
}

/** Passos em que o cliptest começa (linha 3: result = Verdade). */
const chamadasCliptest = (passos: Passo[]) => passos.filter((p) => p.linha === 3);

describe('Liang-Barsky', () => {
  it('P1(−3, 1)–P2(4, 2): u1 = 3/7, u2 = 1 → (0, 1.43)–(4, 2)', () => {
    const { passos, resultado } = executar(-3, 1, 4, 2);
    const fim = ultimo(passos);
    expect(fim.variaveis.u1).toBeCloseTo(3 / 7, 12);
    expect(fim.variaveis.u2).toBe(1);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento!.x1).toBe(0);
    expect(resultado.segmento!.y1).toBeCloseTo(10 / 7, 9);
    expect(resultado.segmento!.x2).toBe(4);
    expect(resultado.segmento!.y2).toBe(2);
  });

  it('P4(−1, 8)–P3(8, −1): u1 = 1/3, u2 = 7/9 → (2, 5)–(6, 1); tabela com 4 linhas', () => {
    const { passos, resultado } = executar(-1, 8, 8, -1);
    const fim = ultimo(passos);
    expect(fim.variaveis.u1).toBeCloseTo(1 / 3, 12);
    expect(fim.variaveis.u2).toBeCloseTo(7 / 9, 12);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento).toEqual({ x1: 2, y1: 5, x2: 6, y2: 1 });

    const linhas = tabela(fim);
    expect(linhas).toHaveLength(4);
    // k, p_k, q_k
    expect(linhas.map((l) => l.slice(0, 3))).toEqual([
      [1, -9, -1],
      [2, 9, 7],
      [3, 9, 8],
      [4, -9, -3],
    ]);
    // r_k = q_k / p_k
    const r = linhas.map((l) => l[3] as number);
    expect(r[0]).toBeCloseTo(1 / 9, 12);
    expect(r[1]).toBeCloseTo(7 / 9, 12);
    expect(r[2]).toBeCloseTo(8 / 9, 12);
    expect(r[3]).toBeCloseTo(1 / 3, 12);
    // u1 e u2 depois de cada cliptest, e todos retornam Verdade
    expect(linhas[0][4]).toBeCloseTo(1 / 9, 12);
    expect(linhas[1][5]).toBeCloseTo(7 / 9, 12);
    expect(linhas[3][4]).toBeCloseTo(1 / 3, 12);
    expect(linhas.map((l) => l[6])).toEqual([true, true, true, true]);
    expect(resultado.pixels[0]).toEqual({ x: 2, y: 5 });
    expect(resultado.pixels[resultado.pixels.length - 1]).toEqual({ x: 6, y: 1 });
  });

  it('a tabela é preenchida aos poucos (uma linha por chamada de cliptest)', () => {
    const { passos } = executar(-1, 8, 8, -1);
    const tamanhos = passos.map((p) => tabela(p).length);
    expect(tamanhos[0]).toBe(0);
    for (let i = 1; i < tamanhos.length; i++) expect(tamanhos[i]).toBeGreaterThanOrEqual(tamanhos[i - 1]);
    expect(new Set(tamanhos)).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it('P5(−1, 4)–P6(−1, 6): rejeitada no 1º cliptest (p = 0, q = −1)', () => {
    const { passos, resultado } = executar(-1, 4, -1, 6);
    expect(resultado).toEqual({ aceito: false, segmento: null, pixels: [] });
    expect(chamadasCliptest(passos)).toHaveLength(1);
    const linhas = tabela(ultimo(passos));
    expect(linhas).toEqual([[1, 0, -1, null, 0, 1, false]]);
    const paralela = passos.find((p) => p.linha === 12)!;
    expect(paralela.variaveis.p).toBe(0);
    expect(paralela.variaveis.q).toBe(-1);
    expect(paralela.variaveis.result).toBe(false);
    expect(passos.some((p) => p.pixels && p.pixels.length > 0)).toBe(false);
  });

  it('paralela interna sai inalterada', () => {
    const { passos, resultado } = executar(1, 3, 5, 3);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento).toEqual({ x1: 1, y1: 3, x2: 5, y2: 3 });
    expect(ultimo(passos).variaveis.u1).toBe(0);
    expect(ultimo(passos).variaveis.u2).toBe(1);
    expect(resultado.pixels).toHaveLength(5);
  });

  it('ponto único: fora é rejeitado, dentro é desenhado', () => {
    expect(executar(9, 9, 9, 9).resultado.aceito).toBe(false);
    expect(executar(2, 2, 2, 2).resultado.pixels).toEqual([{ x: 2, y: 2 }]);
  });

  it('cliptest é percorrido por dentro (sub-generator): 4 chamadas, cada uma termina em "retorna"', () => {
    const { passos } = executar(-1, 8, 8, -1);
    expect(chamadasCliptest(passos)).toHaveLength(4);
    expect(passos.filter((p) => p.linha === 14)).toHaveLength(4);
  });

  it('overlays mostram P(u1) e P(u2) como pontos reais', () => {
    const { passos } = executar(-1, 8, 8, -1);
    const pontos = (ultimo(passos).overlays ?? []).filter((o) => o.tipo === 'ponto-real');
    expect(pontos.map((o) => (o.tipo === 'ponto-real' ? [o.x, o.y] : []))).toEqual([
      [2, 5],
      [6, 1],
    ]);
  });

  it('linhas dentro da listagem e variáveis serializáveis', () => {
    const total = contarLinhas(algoritmoLiangBarsky.codigo);
    const casos: Array<[number, number, number, number]> = [
      [-3, 1, 4, 2],
      [-1, 8, 8, -1],
      [-1, 4, -1, 6],
      [1, 3, 5, 3],
      [8, 3, 2, 7],
      [7, 7, 9, 9],
    ];
    for (const caso of casos) {
      const { passos } = executar(...caso);
      expect(ultimo(passos).linha === 32 || ultimo(passos).linha === 34).toBe(true);
      for (const p of passos) {
        expect(p.linha).toBeGreaterThanOrEqual(1);
        expect(p.linha).toBeLessThanOrEqual(total);
        expect(JSON.parse(JSON.stringify(p.variaveis))).toEqual(p.variaveis);
      }
    }
  });
});
