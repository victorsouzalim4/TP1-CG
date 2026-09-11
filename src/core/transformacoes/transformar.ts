/**
 * Transformações geométricas 2D aplicadas passo a passo aos objetos selecionados — slides
 * "CG 02 Transf 2D". STUB da fase A1: os tipos são definitivos; a implementação chega na fase B.
 */
import type { Algoritmo, Matriz3, Passo, Pixel } from '../tipos';
import type { ObjetoGrafico } from '../cena/objetos';

export interface ParametrosTransformacao {
  /** Objetos (já selecionados) que serão transformados. */
  objetos: ObjetoGrafico[];
  /** Matriz final (produto de `composicao`). */
  matriz: Matriz3;
  /** Fatores da composição, na ordem de multiplicação (a última é a primeira aplicada). */
  composicao: { rotulo: string; matriz: Matriz3 }[];
}

export interface ResultadoTransformacao {
  /** Cópias transformadas dos objetos (mesmos ids). */
  objetos: ObjetoGrafico[];
  /** Pixels dos objetos transformados, já rasterizados. */
  pixels: Pixel[];
}

export const CODIGO_TRANSFORMACAO = '';

export const algoritmoTransformacao: Algoritmo<ParametrosTransformacao, ResultadoTransformacao> = {
  id: 'transformacao',
  nome: 'Transformações 2D',
  codigo: CODIGO_TRANSFORMACAO,
  executar(): Generator<Passo, ResultadoTransformacao, void> {
    throw new Error('não implementado');
  },
};
