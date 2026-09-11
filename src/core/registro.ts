/**
 * Registro dos algoritmos do core (sem React). Cada módulo da UI usa o algoritmo pelo id.
 */
import type { Algoritmo } from './tipos';
import { algoritmoDDA } from './rasterizacao/dda';
import { algoritmoBresenhamReta } from './rasterizacao/bresenhamReta';
import { algoritmoBresenhamCirculo } from './rasterizacao/bresenhamCirculo';
import { algoritmoCohenSutherland } from './recorte/cohenSutherland';
import { algoritmoLiangBarsky } from './recorte/liangBarsky';
import { algoritmoTransformacao } from './transformacoes/transformar';
import { algoritmoBoundaryFill } from './preenchimento/boundaryFill';
import { algoritmoFloodFill } from './preenchimento/floodFill';

export type AlgoritmoId =
  | 'dda'
  | 'bresenham-reta'
  | 'bresenham-circulo'
  | 'cohen-sutherland'
  | 'liang-barsky'
  | 'transformacao'
  | 'boundary-fill'
  | 'flood-fill';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lista heterogênea; use o objeto tipado de cada módulo
export const ALGORITMOS: Algoritmo<any, any>[] = [
  algoritmoDDA,
  algoritmoBresenhamReta,
  algoritmoBresenhamCirculo,
  algoritmoCohenSutherland,
  algoritmoLiangBarsky,
  algoritmoTransformacao,
  algoritmoBoundaryFill,
  algoritmoFloodFill,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function obterAlgoritmo(id: AlgoritmoId): Algoritmo<any, any> {
  const alg = ALGORITMOS.find((a) => a.id === id);
  if (!alg) throw new Error(`Algoritmo desconhecido: ${id}`);
  return alg;
}
