/**
 * Estrutura de dados da cena: pontos, retas, polígonos, circunferências e preenchimentos.
 * Exigência do TP: vértices/pontos, retas e polígonos selecionáveis por região retangular.
 *
 * Os vértices são armazenados como números reais (só se arredonda ao rasterizar),
 * evitando acúmulo de erro em rotações sucessivas.
 */
import type { Matriz3, Pixel, Ponto } from '../tipos';
import { gerarId } from '../geometria';

interface ObjetoBase {
  id: string;
  /** Nome exibido na aba "Objetos", ex.: "Reta 1". */
  nome: string;
  cor: string;
  selecionado: boolean;
}

export type ObjetoPonto = ObjetoBase & { tipo: 'ponto'; p: Ponto };
export type ObjetoReta = ObjetoBase & { tipo: 'reta'; p1: Ponto; p2: Ponto; rasterizador: 'dda' | 'bresenham' };
/** Polígono sempre fechado (a última aresta liga o último vértice ao primeiro). */
export type ObjetoPoligono = ObjetoBase & { tipo: 'poligono'; vertices: Ponto[] };
export type ObjetoCirculo = ObjetoBase & { tipo: 'circulo'; centro: Ponto; raio: number };
/** Resultado de um preenchimento (conjunto de pixels); não é selecionável por região. */
export type ObjetoPreenchimento = ObjetoBase & { tipo: 'preenchimento'; pixels: Pixel[] };

export type ObjetoGrafico = ObjetoPonto | ObjetoReta | ObjetoPoligono | ObjetoCirculo | ObjetoPreenchimento;
export type TipoObjeto = ObjetoGrafico['tipo'];

/** Vértices que definem o objeto (usados para seleção por região e para transformações). */
export function verticesDe(obj: ObjetoGrafico): Ponto[] {
  switch (obj.tipo) {
    case 'ponto':
      return [obj.p];
    case 'reta':
      return [obj.p1, obj.p2];
    case 'poligono':
      return obj.vertices;
    case 'circulo':
      return [obj.centro];
    case 'preenchimento':
      return [];
  }
}

/** Devolve `true` para objetos que podem ser selecionados por região retangular. */
export function selecionavel(obj: ObjetoGrafico): boolean {
  return obj.tipo !== 'preenchimento';
}

/**
 * Aplica a matriz homogênea `M` a um ponto: P' = M · [x, y, 1]^T.
 * (Duplicada de `matriz.ts` de forma mínima para evitar ciclo de importação.)
 */
function aplicarM(M: Matriz3, p: Ponto): Ponto {
  return {
    x: M[0][0] * p.x + M[0][1] * p.y + M[0][2],
    y: M[1][0] * p.x + M[1][1] * p.y + M[1][2],
  };
}

/**
 * Devolve uma cópia do objeto com a matriz `M` aplicada aos seus vértices.
 * Circunferência: o centro é transformado; o raio é multiplicado por |M[0][0]| apenas quando a
 * escala é uniforme (|M[0][0]| = |M[1][1]| e sem cisalhamento); caso contrário o raio é mantido.
 */
export function transformarObjeto(obj: ObjetoGrafico, M: Matriz3): ObjetoGrafico {
  switch (obj.tipo) {
    case 'ponto':
      return { ...obj, p: aplicarM(M, obj.p) };
    case 'reta':
      return { ...obj, p1: aplicarM(M, obj.p1), p2: aplicarM(M, obj.p2) };
    case 'poligono':
      return { ...obj, vertices: obj.vertices.map((v) => aplicarM(M, v)) };
    case 'circulo': {
      const sx = Math.hypot(M[0][0], M[1][0]);
      const sy = Math.hypot(M[0][1], M[1][1]);
      const uniforme = Math.abs(sx - sy) < 1e-9;
      return { ...obj, centro: aplicarM(M, obj.centro), raio: uniforme ? obj.raio * sx : obj.raio };
    }
    case 'preenchimento':
      return { ...obj, pixels: obj.pixels.map((px) => ({ ...px, ...aplicarM(M, px) })) };
  }
}

// ---------------------------------------------------------------------------------------------
// Fábricas (acrescentadas na fase A1). Deixam `nome` vazio por padrão: o store gera "Reta 1" etc.
// ---------------------------------------------------------------------------------------------

/** Rótulo em pt-BR de cada tipo, usado para gerar os nomes exibidos na aba "Objetos". */
export const ROTULO_TIPO: Record<TipoObjeto, string> = {
  ponto: 'Ponto',
  reta: 'Reta',
  poligono: 'Polígono',
  circulo: 'Circunferência',
  preenchimento: 'Preenchimento',
};

function base(tipo: TipoObjeto, cor: string, nome: string): ObjetoBase {
  return { id: gerarId(tipo), nome, cor, selecionado: false };
}

export function criarPonto(p: Ponto, cor: string, nome = ''): ObjetoPonto {
  return { ...base('ponto', cor, nome), tipo: 'ponto', p: { ...p } };
}

export function criarReta(
  p1: Ponto,
  p2: Ponto,
  cor: string,
  rasterizador: 'dda' | 'bresenham' = 'bresenham',
  nome = '',
): ObjetoReta {
  return { ...base('reta', cor, nome), tipo: 'reta', p1: { ...p1 }, p2: { ...p2 }, rasterizador };
}

export function criarPoligono(vertices: readonly Ponto[], cor: string, nome = ''): ObjetoPoligono {
  return { ...base('poligono', cor, nome), tipo: 'poligono', vertices: vertices.map((v) => ({ ...v })) };
}

export function criarCirculo(centro: Ponto, raio: number, cor: string, nome = ''): ObjetoCirculo {
  return { ...base('circulo', cor, nome), tipo: 'circulo', centro: { ...centro }, raio };
}

export function criarPreenchimento(pixels: readonly Pixel[], cor: string, nome = ''): ObjetoPreenchimento {
  return { ...base('preenchimento', cor, nome), tipo: 'preenchimento', pixels: pixels.map((px) => ({ ...px })) };
}
