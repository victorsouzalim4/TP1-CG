import { describe, expect, it } from 'vitest';
import { algoritmoCohenSutherland, type ResultadoRecorte } from '../../../src/core/recorte/cohenSutherland';
import { region_code, formatarCodigo, rotulosDasRegioes } from '../../../src/core/recorte/regiaoCodigo';
import { contarLinhas, type Passo, type Retangulo } from '../../../src/core/tipos';

/** Janela dos slides: x ∈ [0, 6], y ∈ [0, 5]. */
const JANELA: Retangulo = { xmin: 0, ymin: 0, xmax: 6, ymax: 5 };

function executar(x1: number, y1: number, x2: number, y2: number, janela = JANELA): { passos: Passo[]; resultado: ResultadoRecorte } {
  const gen = algoritmoCohenSutherland.executar({ x1, y1, x2, y2, janela });
  const passos: Passo[] = [];
  let r = gen.next();
  while (!r.done) {
    passos.push(r.value);
    r = gen.next();
  }
  return { passos, resultado: r.value };
}

/** Linhas 36/38 da listagem: um extremo é substituído pela interseção. */
const LINHAS_TROCA = [36, 38];
const interseccoes = (passos: Passo[]) => passos.filter((p) => LINHAS_TROCA.includes(p.linha));

describe('region_code', () => {
  it('códigos dos slides: (−1, 8) = 1001₂ e (8, −1) = 0110₂', () => {
    expect(region_code(-1, 8, JANELA)).toBe(0b1001);
    expect(region_code(8, -1, JANELA)).toBe(0b0110);
    expect(formatarCodigo(region_code(-1, 8, JANELA))).toBe('1001');
    expect(formatarCodigo(region_code(8, -1, JANELA))).toBe('0110');
  });

  it('limites são inclusivos: pontos na borda têm código 0', () => {
    expect(region_code(0, 0, JANELA)).toBe(0);
    expect(region_code(6, 5, JANELA)).toBe(0);
    expect(region_code(3, 2, JANELA)).toBe(0);
  });

  it('as 9 regiões recebem os 9 códigos distintos', () => {
    const limites: Retangulo = { xmin: -5, ymin: -5, xmax: 10, ymax: 10 };
    const codigos = rotulosDasRegioes(JANELA, limites).map((r) => r.texto);
    expect(codigos).toEqual(['1001', '1000', '1010', '0001', '0000', '0010', '0101', '0100', '0110']);
  });

  it('regiões fora da área visível são omitidas', () => {
    const limites: Retangulo = { xmin: 0, ymin: 0, xmax: 19, ymax: 14 };
    const codigos = rotulosDasRegioes(JANELA, limites).map((r) => r.texto);
    expect(codigos).toEqual(['1000', '1010', '0000', '0010']);
  });
});

describe('Cohen-Sutherland', () => {
  it('P1(−3, 1)–P2(4, 2): aceita com 1 interseção, (0, 1.43)–(4, 2)', () => {
    const { passos, resultado } = executar(-3, 1, 4, 2);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento!.x1).toBe(0);
    expect(resultado.segmento!.y1).toBeCloseTo(10 / 7, 9);
    expect(resultado.segmento!.x2).toBe(4);
    expect(resultado.segmento!.y2).toBe(2);
    expect(interseccoes(passos)).toHaveLength(1);
    // desenha_linha(round(0), round(1.43), 4, 2) com Bresenham
    expect(resultado.pixels.map((p) => [p.x, p.y])).toEqual([
      [0, 1],
      [1, 1],
      [2, 2],
      [3, 2],
      [4, 2],
    ]);
  });

  it('P4(−1, 8)–P3(8, −1): 3 interseções (0, 7) → (2, 5), (6, 1); final (2, 5)–(6, 1)', () => {
    const { passos, resultado } = executar(-1, 8, 8, -1);
    const trocas = interseccoes(passos).map((p) => [p.variaveis.xint, p.variaveis.yint]);
    expect(trocas).toEqual([
      [0, 7],
      [2, 5],
      [6, 1],
    ]);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento).toEqual({ x1: 2, y1: 5, x2: 6, y2: 1 });
    // 4 iterações do laço: 3 com interseção e a última em que c1 = c2 = 0
    expect(passos[passos.length - 1].variaveis.iteracao).toBe(4);
    const primeiro = passos.find((p) => p.linha === 14)!;
    expect(primeiro.variaveis.c1).toEqual({ tipo: 'bits', valor: 0b1001, rotulos: ['C', 'B', 'D', 'E'] });
    expect(primeiro.variaveis.c2).toEqual({ tipo: 'bits', valor: 0b0110, rotulos: ['C', 'B', 'D', 'E'] });
    expect(resultado.pixels[0]).toEqual({ x: 2, y: 5 });
    expect(resultado.pixels[resultado.pixels.length - 1]).toEqual({ x: 6, y: 1 });
  });

  it('P5(−1, 4)–P6(−1, 6): rejeitada na 1ª iteração', () => {
    const { passos, resultado } = executar(-1, 4, -1, 6);
    expect(resultado).toEqual({ aceito: false, segmento: null, pixels: [] });
    expect(interseccoes(passos)).toHaveLength(0);
    const rejeicao = passos.find((p) => p.linha === 18)!;
    expect(rejeicao.variaveis.iteracao).toBe(1);
    expect(rejeicao.descricao).toContain('totalmente fora (c1 AND c2 ≠ 0)');
    expect(passos.some((p) => p.pixels && p.pixels.length > 0)).toBe(false);
  });

  it('reta totalmente dentro sai inalterada', () => {
    const { passos, resultado } = executar(1, 1, 5, 4);
    expect(resultado.aceito).toBe(true);
    expect(resultado.segmento).toEqual({ x1: 1, y1: 1, x2: 5, y2: 4 });
    expect(interseccoes(passos)).toHaveLength(0);
    expect(resultado.pixels[0]).toEqual({ x: 1, y: 1 });
    expect(resultado.pixels[resultado.pixels.length - 1]).toEqual({ x: 5, y: 4 });
  });

  it('ponto único fora da janela é rejeitado; dentro é aceito', () => {
    expect(executar(9, 9, 9, 9).resultado.aceito).toBe(false);
    expect(executar(2, 2, 2, 2).resultado.pixels).toEqual([{ x: 2, y: 2 }]);
  });

  it('os pixels saem no passo desenha_linha (linha 42), o último da execução', () => {
    const { passos, resultado } = executar(-3, 1, 4, 2);
    const ultimo = passos[passos.length - 1];
    expect(ultimo.linha).toBe(42);
    expect(ultimo.pixels).toEqual(resultado.pixels);
  });

  it('todas as linhas dos passos estão dentro da listagem e as variáveis são serializáveis', () => {
    const total = contarLinhas(algoritmoCohenSutherland.codigo);
    const casos: Array<[number, number, number, number]> = [
      [-3, 1, 4, 2],
      [-1, 8, 8, -1],
      [-1, 4, -1, 6],
      [1, 1, 5, 4],
      [8, 3, 2, 7],
    ];
    for (const caso of casos) {
      for (const p of executar(...caso).passos) {
        expect(p.linha).toBeGreaterThanOrEqual(1);
        expect(p.linha).toBeLessThanOrEqual(total);
        expect(JSON.parse(JSON.stringify(p.variaveis))).toEqual(p.variaveis);
      }
    }
  });

  it('snapshot na ordem da especificação', () => {
    const { passos } = executar(-1, 8, 8, -1);
    expect(Object.keys(passos[passos.length - 1].variaveis)).toEqual([
      'xmin', 'xmax', 'ymin', 'ymax', 'x1', 'y1', 'x2', 'y2',
      'c1', 'c2', 'cfora', 'xint', 'yint', 'aceite', 'feito', 'iteracao',
    ]);
  });

  it('region_code é percorrida linha a linha (sub-generator)', () => {
    const { passos } = executar(-1, 8, 8, -1);
    const dentro = passos.filter((p) => p.linha >= 3 && p.linha <= 8);
    // 4 iterações × 2 chamadas × 6 linhas (código = 0, 4 testes, retorna)
    expect(dentro).toHaveLength(48);
    expect(dentro[0].variaveis['código']).toEqual({ tipo: 'bits', valor: 0, rotulos: ['C', 'B', 'D', 'E'] });
  });
});
