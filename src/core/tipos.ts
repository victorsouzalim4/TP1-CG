/**
 * Contrato central entre os algoritmos (core), o depurador e a interface.
 *
 * Regras:
 *  - Nenhum import de React aqui: o core é TypeScript puro e testável com vitest.
 *  - Tudo é serializável em JSON, para que cada passo seja um snapshot independente.
 *  - Coordenadas seguem os slides: origem inferior-esquerda, Y para cima.
 */

/** Ponto no plano. Inteiro para pixels; pode ser real após transformações (arredonda-se ao rasterizar). */
export interface Ponto {
  x: number;
  y: number;
}

/** Pixel da matriz. `cor` opcional: se ausente, o depurador aplica a `corPadrao` da sessão. */
export interface Pixel extends Ponto {
  cor?: string;
}

/** Retângulo em coordenadas de célula, limites INCLUSIVOS (região de seleção e janela de recorte). */
export interface Retangulo {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

/** Matriz homogênea 3x3, linha-major (M[linha][coluna]). P' = M · P, com P = [x, y, 1]^T. */
export type Matriz3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/**
 * Valores exibíveis no painel "Variáveis".
 * Os tipos marcados com `tipo` recebem renderização especial na interface.
 */
export type Valor =
  | number
  | string
  | boolean
  | null
  | { tipo: 'ponto'; x: number; y: number }
  /** Código de região (Cohen-Sutherland). `rotulos` do bit mais ao menos significativo, ex.: ['C','B','D','E']. */
  | { tipo: 'bits'; valor: number; rotulos: string[] }
  /** Matriz 3x3 ou vetor coluna 3x1. */
  | { tipo: 'matriz'; linhas: number[][]; rotulo?: string }
  /** Pilha (preenchimento). `topo[0]` é o topo; só os N primeiros elementos são enviados. */
  | { tipo: 'pilha'; topo: Valor[]; tamanho: number }
  /** Tabela (ex.: p_k, q_k, r_k do Liang-Barsky). */
  | { tipo: 'tabela'; colunas: string[]; linhas: Valor[][] }
  | { tipo: 'lista'; itens: Valor[] };

export type Variaveis = Record<string, Valor>;

/**
 * Anotações visuais temporárias desenhadas sobre a grade.
 * Os overlays de um passo SUBSTITUEM os do passo anterior (não acumulam).
 */
export type Overlay =
  | { tipo: 'celula'; x: number; y: number; cor: string; estilo?: 'contorno' | 'preenchido'; rotulo?: string }
  /** Ponto com coordenadas reais (não inteiras): (x, y) do DDA, interseções do recorte etc. */
  | { tipo: 'ponto-real'; x: number; y: number; cor: string; rotulo?: string }
  | { tipo: 'segmento'; x1: number; y1: number; x2: number; y2: number; cor: string; tracejado?: boolean; opacidade?: number }
  | { tipo: 'retangulo'; ret: Retangulo; cor: string; tracejado?: boolean; rotulo?: string }
  | { tipo: 'circulo-ideal'; xc: number; yc: number; r: number; cor: string; tracejado?: boolean }
  | { tipo: 'poligono-ideal'; vertices: Ponto[]; cor: string; tracejado?: boolean; fechado?: boolean }
  /** Texto centrado em (x, y), em coordenadas de célula (reais). */
  | { tipo: 'texto'; x: number; y: number; texto: string; cor?: string }
  | { tipo: 'seta'; de: Ponto; para: Ponto; cor: string };

/** Um passo da execução de um algoritmo (um `yield`). */
export interface Passo {
  /** Linha da listagem (`Algoritmo.codigo`), 1-based. */
  linha: number;
  /** Snapshot COMPLETO das variáveis visíveis neste passo (não é um delta). */
  variaveis: Variaveis;
  /** Pixels pintados NESTE passo; o depurador acumula ao longo dos passos. */
  pixels?: Pixel[];
  /** Anotações visuais válidas apenas neste passo. */
  overlays?: Overlay[];
  /** Frase curta em pt-BR explicando o passo ("Calcula o incremento em x"). */
  descricao?: string;
}

/** Todo algoritmo do simulador implementa esta interface. */
export interface Algoritmo<P, R> {
  /** Identificador estável: 'dda', 'bresenham-reta', ... */
  id: string;
  /** Nome exibido: 'DDA'. */
  nome: string;
  /** Listagem exibida na aba "Código"; linhas separadas por '\n'. Os `linha` dos passos referem-se a ela. */
  codigo: string;
  /** Executa o algoritmo produzindo um passo por `yield` e o resultado final como valor de retorno. */
  executar(params: P): Generator<Passo, R, void>;
}

/** Helper para construir passos com menos ruído dentro dos algoritmos. */
export function passo(
  linha: number,
  variaveis: Variaveis,
  extra: Omit<Passo, 'linha' | 'variaveis'> = {},
): Passo {
  return { linha, variaveis, ...extra };
}

/** Número de linhas de uma listagem (para validar `Passo.linha`). */
export function contarLinhas(codigo: string): number {
  return codigo.length === 0 ? 0 : codigo.split('\n').length;
}
