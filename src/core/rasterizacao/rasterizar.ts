/**
 * Rasterização "sem depuração": executa os algoritmos até o fim e devolve só os pixels.
 * Usada para desenhar a cena base (todos os objetos) e para os módulos que precisam do
 * resultado pronto (ex.: contorno antes de um preenchimento).
 */
import type { Passo, Pixel, Ponto } from '../tipos';
import { round } from '../geometria';
import type { ObjetoGrafico } from '../cena/objetos';
import { algoritmoDDA } from './dda';
import { algoritmoBresenhamReta } from './bresenhamReta';
import { algoritmoBresenhamCirculo } from './bresenhamCirculo';

/** Consome um generator de algoritmo inteiro, acumulando os pixels de todos os passos. */
export function coletarPixels<R>(gen: Generator<Passo, R, void>): { pixels: Pixel[]; resultado: R } {
  const pixels: Pixel[] = [];
  let r = gen.next();
  while (!r.done) {
    const lista = r.value.pixels;
    if (lista) for (const px of lista) pixels.push(px);
    r = gen.next();
  }
  return { pixels, resultado: r.value };
}

/** Arredonda um vértice real para a célula (os algoritmos trabalham só com inteiros). */
function inteiro(p: Ponto): Ponto {
  return { x: round(p.x), y: round(p.y) };
}

/** Remove pixels repetidos mantendo a primeira ocorrência (ordem de pintura). */
function semDuplicados(pixels: Pixel[]): Pixel[] {
  const vistos = new Set<string>();
  const unicos: Pixel[] = [];
  for (const px of pixels) {
    const chave = `${px.x},${px.y}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(px);
  }
  return unicos;
}

export function rasterizarReta(p1: Ponto, p2: Ponto, rasterizador: 'dda' | 'bresenham'): Pixel[] {
  const a = inteiro(p1);
  const b = inteiro(p2);
  const params = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const alg = rasterizador === 'dda' ? algoritmoDDA : algoritmoBresenhamReta;
  return coletarPixels(alg.executar(params)).pixels;
}

export function rasterizarCirculo(centro: Ponto, raio: number): Pixel[] {
  const c = inteiro(centro);
  return semDuplicados(
    coletarPixels(algoritmoBresenhamCirculo.executar({ xc: c.x, yc: c.y, r: Math.max(0, round(raio)) })).pixels,
  );
}

/** Polígono fechado: cada aresta (inclusive a última, que volta ao primeiro vértice) com Bresenham. */
export function rasterizarPoligono(vertices: readonly Ponto[]): Pixel[] {
  if (vertices.length === 0) return [];
  if (vertices.length === 1) return [inteiro(vertices[0])];
  const pixels: Pixel[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    // Um polígono de 2 vértices é um segmento: não repete a aresta de volta.
    if (vertices.length === 2 && i === 1) break;
    for (const px of rasterizarReta(a, b, 'bresenham')) pixels.push(px);
  }
  return semDuplicados(pixels);
}

/** Pixels de um objeto da cena, já com `cor` atribuída e sem duplicados. */
export function rasterizarObjeto(obj: ObjetoGrafico): Pixel[] {
  let pixels: Pixel[];
  switch (obj.tipo) {
    case 'ponto':
      pixels = [inteiro(obj.p)];
      break;
    case 'reta':
      pixels = rasterizarReta(obj.p1, obj.p2, obj.rasterizador);
      break;
    case 'poligono':
      pixels = rasterizarPoligono(obj.vertices);
      break;
    case 'circulo':
      pixels = rasterizarCirculo(obj.centro, obj.raio);
      break;
    case 'preenchimento':
      // Um preenchimento já é um conjunto de pixels; pode ter passado por transformação (coordenadas reais).
      pixels = obj.pixels.map((px) => ({ x: round(px.x), y: round(px.y), cor: px.cor ?? obj.cor }));
      break;
  }
  return semDuplicados(pixels.map((px) => ({ x: px.x, y: px.y, cor: px.cor ?? obj.cor })));
}
