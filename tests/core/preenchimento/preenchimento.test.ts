import { describe, expect, it } from 'vitest';
import {
  algoritmoBoundaryFill,
  algoritmoBoundaryFill8,
  algoritmoBoundaryFillPara,
  CODIGO_BOUNDARY_FILL,
  CODIGO_BOUNDARY_FILL_8,
} from '../../../src/core/preenchimento/boundaryFill';
import {
  algoritmoFloodFill,
  algoritmoFloodFillPara,
  CODIGO_FLOOD_FILL,
  CODIGO_FLOOD_FILL_8,
} from '../../../src/core/preenchimento/floodFill';
import { snapshotPilha, vizinhos, type ParametrosPreenchimento, type ResultadoPreenchimento } from '../../../src/core/preenchimento/comum';
import { MatrizPixels } from '../../../src/core/matrizPixels';
import { rasterizarPoligono } from '../../../src/core/rasterizacao/rasterizar';
import { COR_FUNDO, PALETA } from '../../../src/core/cores';
import { contarLinhas, type Algoritmo, type Passo, type Ponto } from '../../../src/core/tipos';

const PRETO = PALETA[0].hex;
const VERMELHO = PALETA[1].hex;
const AZUL = PALETA[3].hex;

/** Grade 20×15 (x ∈ [0, 19], y ∈ [0, 14]). */
const LIMITES = { xmin: 0, ymin: 0, xmax: 19, ymax: 14 };

/** Matriz com o contorno do polígono `vertices` pintado de preto. */
function matrizCom(vertices: Ponto[]): MatrizPixels {
  return MatrizPixels.deCena(rasterizarPoligono(vertices), LIMITES, PRETO);
}

/** Retângulo (2,2)–(7,6): contorno ocupa as bordas, interior x ∈ [3, 6], y ∈ [3, 5] = 4 × 3 = 12. */
const RETANGULO: Ponto[] = [
  { x: 2, y: 2 },
  { x: 7, y: 2 },
  { x: 7, y: 6 },
  { x: 2, y: 6 },
];

/** Triângulo retângulo com hipotenusa a 45° (pixels da hipotenusa só se tocam pelos cantos). */
const TRIANGULO: Ponto[] = [
  { x: 2, y: 2 },
  { x: 12, y: 2 },
  { x: 2, y: 12 },
];

function executar(
  alg: Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento>,
  params: ParametrosPreenchimento,
): { passos: Passo[]; resultado: ResultadoPreenchimento } {
  const gen = alg.executar(params);
  const passos: Passo[] = [];
  let r = gen.next();
  while (!r.done) {
    passos.push(r.value);
    r = gen.next();
  }
  return { passos, resultado: r.value };
}

function boundary(vertices: Ponto[], semente: Ponto, conectividade: 4 | 8) {
  return executar(algoritmoBoundaryFillPara(conectividade), {
    ...semente,
    corPreenche: AZUL,
    corContorno: PRETO,
    conectividade,
    matriz: matrizCom(vertices),
  });
}

function flood(vertices: Ponto[], semente: Ponto, conectividade: 4 | 8, corPreenche = AZUL) {
  return executar(algoritmoFloodFillPara(conectividade), {
    ...semente,
    corPreenche,
    conectividade,
    matriz: matrizCom(vertices),
  });
}

const chaves = (pixels: Ponto[]) => new Set(pixels.map((p) => `${p.x},${p.y}`));

function interiorRetangulo(): Set<string> {
  const s = new Set<string>();
  for (let x = 3; x <= 6; x++) for (let y = 3; y <= 5; y++) s.add(`${x},${y}`);
  return s;
}

describe('Boundary Fill', () => {
  it('conectividade 4 no retângulo (2,2)–(7,6) com semente (4,4): 12 pixels (interior 4 × 3)', () => {
    const { resultado } = boundary(RETANGULO, { x: 4, y: 4 }, 4);
    expect(resultado.total).toBe(12);
    expect(chaves(resultado.pixels)).toEqual(interiorRetangulo());
    expect(resultado.pixels.every((p) => p.cor === AZUL)).toBe(true);
  });

  it('conectividade 8 no mesmo retângulo: também 12 (os cantos do contorno estão pintados)', () => {
    const { resultado } = boundary(RETANGULO, { x: 4, y: 4 }, 8);
    expect(resultado.total).toBe(12);
    expect(chaves(resultado.pixels)).toEqual(interiorRetangulo());
  });

  it('semente no contorno: 0 pixels pintados', () => {
    const { resultado, passos } = boundary(RETANGULO, { x: 2, y: 4 }, 4);
    expect(resultado.total).toBe(0);
    expect(passos.some((p) => p.descricao?.includes('cor_atual = cor_contorno'))).toBe(true);
  });

  it('triângulo com hipotenusa diagonal: conectividade 4 fica dentro, 8 vaza', () => {
    const semente = { x: 4, y: 4 };
    const dentro = boundary(TRIANGULO, semente, 4).resultado;
    // Interior: x ≥ 3, y ≥ 3, x + y ≤ 13 → 8 + 7 + … + 1 = 36 células
    expect(dentro.total).toBe(36);
    expect(dentro.pixels.every((p) => p.x >= 3 && p.y >= 3 && p.x + p.y <= 13)).toBe(true);

    const vazou = boundary(TRIANGULO, semente, 8).resultado;
    expect(vazou.total).toBeGreaterThan(36);
    expect(chaves(vazou.pixels).has('15,10')).toBe(true); // bem fora do triângulo
  });

  it('semente fora da forma enche a grade; a borda da grade limita (sem laço infinito)', () => {
    const { resultado } = boundary(RETANGULO, { x: 15, y: 10 }, 4);
    const contorno = rasterizarPoligono(RETANGULO).length; // 18 células
    expect(resultado.total).toBe(20 * 15 - contorno - 12);
    expect(resultado.pixels.every((p) => p.x >= 0 && p.x <= 19 && p.y >= 0 && p.y <= 14)).toBe(true);
  });

  it('não altera a matriz recebida (trabalha sobre uma cópia)', () => {
    const matriz = matrizCom(RETANGULO);
    const antes = matriz.quantidade;
    executar(algoritmoBoundaryFill, { x: 4, y: 4, corPreenche: AZUL, corContorno: PRETO, conectividade: 4, matriz });
    expect(matriz.quantidade).toBe(antes);
    expect(matriz.inquirirCor(4, 4)).toBe(COR_FUNDO);
  });

  it('3 passos por célula pintada e 2 por célula recusada; variáveis e pilha no snapshot', () => {
    const { passos, resultado } = boundary(RETANGULO, { x: 4, y: 4 }, 4);
    const desempilhados = passos.filter((p) => p.linha === 5).length;
    // 1 passo da semente + 2 por célula desempilhada + 1 extra por célula pintada
    expect(passos.length).toBe(1 + 2 * desempilhados + resultado.total);
    const primeiro = passos[0];
    expect(Object.keys(primeiro.variaveis)).toEqual(['x', 'y', 'cor_atual', 'cor_preenche', 'cor_contorno', 'pilha', 'pintados']);
    expect(primeiro.variaveis.pilha).toEqual({ tipo: 'pilha', topo: [{ tipo: 'ponto', x: 4, y: 4 }], tamanho: 1 });
    expect(primeiro.variaveis.cor_contorno).toBe('Preto');
    const ultimo = passos[passos.length - 1];
    expect(ultimo.variaveis.pintados).toBe(12);
    // Pixels só são emitidos na linha set_pixel
    expect(passos.filter((p) => p.pixels?.length).every((p) => p.linha === 7)).toBe(true);
  });

  it('overlays: célula atual + no máximo 50 células da pilha', () => {
    const { passos } = boundary(RETANGULO, { x: 15, y: 10 }, 8);
    for (const p of passos) expect((p.overlays ?? []).length).toBeLessThanOrEqual(51);
    expect(passos.some((p) => (p.overlays ?? []).length === 51)).toBe(true);
  });

  it('ordem de visita igual à da recursão dos slides: (x+1, y) sai primeiro', () => {
    const { resultado } = boundary(RETANGULO, { x: 4, y: 4 }, 4);
    expect(resultado.pixels.slice(0, 3).map((p) => [p.x, p.y])).toEqual([
      [4, 4],
      [5, 4],
      [6, 4],
    ]);
  });

  it('linhas dentro da listagem; a de conectividade 8 acrescenta as diagonais', () => {
    expect(contarLinhas(CODIGO_BOUNDARY_FILL)).toBe(13);
    expect(contarLinhas(CODIGO_BOUNDARY_FILL_8)).toBe(15);
    expect(CODIGO_BOUNDARY_FILL).toContain('versão iterativa equivalente à recursiva dos slides');
    expect(CODIGO_BOUNDARY_FILL_8).toContain('(x+1, y+1)');
    expect(CODIGO_BOUNDARY_FILL).not.toContain('(x+1, y+1)');
    for (const c of [4, 8] as const) {
      const alg = algoritmoBoundaryFillPara(c);
      const n = contarLinhas(alg.codigo);
      for (const p of boundary(TRIANGULO, { x: 4, y: 4 }, c).passos) {
        expect(p.linha).toBeGreaterThanOrEqual(1);
        expect(p.linha).toBeLessThanOrEqual(n);
      }
    }
    expect(algoritmoBoundaryFillPara(8)).toBe(algoritmoBoundaryFill8);
  });
});

describe('Flood Fill', () => {
  it('conectividade 4 no retângulo com semente (4,4): 12 pixels', () => {
    const { resultado, passos } = flood(RETANGULO, { x: 4, y: 4 }, 4);
    expect(resultado.total).toBe(12);
    expect(chaves(resultado.pixels)).toEqual(interiorRetangulo());
    expect(passos[0].variaveis.cor_antiga).toBe('Fundo');
  });

  it('conectividade 8 no retângulo: 12 pixels', () => {
    expect(flood(RETANGULO, { x: 4, y: 4 }, 8).resultado.total).toBe(12);
  });

  it('cor_antiga = cor_preenche: retorna na guarda com 0 pintados', () => {
    // Semente no contorno preto pedindo para pintar de preto
    const noContorno = flood(RETANGULO, { x: 2, y: 4 }, 4, PRETO);
    expect(noContorno.resultado.total).toBe(0);
    expect(noContorno.passos).toHaveLength(1);
    expect(noContorno.passos[0].linha).toBe(3);
    // Interior (fundo) pedindo para pintar com a cor de fundo
    expect(flood(RETANGULO, { x: 4, y: 4 }, 4, COR_FUNDO).resultado.total).toBe(0);
  });

  it('semente no contorno recolore o contorno (cor_antiga = Preto)', () => {
    const { resultado } = flood(RETANGULO, { x: 2, y: 4 }, 4, VERMELHO);
    expect(resultado.total).toBe(rasterizarPoligono(RETANGULO).length);
  });

  it('triângulo: conectividade 4 fica dentro, 8 vaza', () => {
    expect(flood(TRIANGULO, { x: 4, y: 4 }, 4).resultado.total).toBe(36);
    expect(flood(TRIANGULO, { x: 4, y: 4 }, 8).resultado.total).toBeGreaterThan(36);
  });

  it('corAntiga explícita diferente da cor da semente: nada é pintado', () => {
    const { resultado } = executar(algoritmoFloodFill, {
      x: 4,
      y: 4,
      corPreenche: AZUL,
      corAntiga: VERMELHO,
      conectividade: 4,
      matriz: matrizCom(RETANGULO),
    });
    expect(resultado.total).toBe(0);
  });

  it('listagem com a guarda e linhas válidas', () => {
    expect(contarLinhas(CODIGO_FLOOD_FILL)).toBe(14);
    expect(contarLinhas(CODIGO_FLOOD_FILL_8)).toBe(16);
    expect(CODIGO_FLOOD_FILL).toContain('se cor_antiga = cor_preenche então retorna');
    for (const c of [4, 8] as const) {
      const n = contarLinhas(algoritmoFloodFillPara(c).codigo);
      for (const p of flood(TRIANGULO, { x: 4, y: 4 }, c).passos) {
        expect(p.linha).toBeGreaterThanOrEqual(1);
        expect(p.linha).toBeLessThanOrEqual(n);
      }
    }
  });
});

describe('utilitários', () => {
  it('vizinhos: 4 diretos na ordem dos slides + 4 diagonais', () => {
    expect(vizinhos(5, 5, 4)).toEqual([
      { x: 6, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 4 },
    ]);
    expect(vizinhos(5, 5, 8)).toHaveLength(8);
  });

  it('snapshotPilha envia só o topo', () => {
    const pilha = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0 }));
    const v = snapshotPilha(pilha);
    expect(v).toMatchObject({ tipo: 'pilha', tamanho: 20 });
    if (typeof v === 'object' && v !== null && 'topo' in v) {
      expect(v.topo).toHaveLength(8);
      expect(v.topo[0]).toEqual({ tipo: 'ponto', x: 19, y: 0 });
    }
  });
});
