/**
 * Funções geométricas utilitárias, sem dependências.
 */
import type { Ponto, Retangulo } from './tipos';

/** Distância euclidiana entre dois pontos. */
export function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Centroide (média aritmética) de uma lista de pontos. Lista vazia devolve a origem. */
export function centroide(pontos: readonly Ponto[]): Ponto {
  if (pontos.length === 0) return { x: 0, y: 0 };
  const soma = pontos.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: soma.x / pontos.length, y: soma.y / pontos.length };
}

/** Normaliza um retângulo definido por dois cantos quaisquer (min/max em cada eixo). */
export function normalizarRetangulo(a: Ponto, b: Ponto): Retangulo {
  return {
    xmin: Math.min(a.x, b.x),
    ymin: Math.min(a.y, b.y),
    xmax: Math.max(a.x, b.x),
    ymax: Math.max(a.y, b.y),
  };
}

/** Verifica se um ponto está dentro (inclusive) de um retângulo. */
export function dentroDoRetangulo(p: Ponto, r: Retangulo): boolean {
  return p.x >= r.xmin && p.x <= r.xmax && p.y >= r.ymin && p.y <= r.ymax;
}

/** Arredonda para N casas decimais. */
export function arredondar(v: number, casas = 3): number {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}

/** Devolve o inteiro mais próximo quando o valor difere dele por menos de 1e-9 (remove ruído de ponto flutuante). */
export function quaseInteiro(v: number): number {
  const r = Math.round(v);
  return Math.abs(v - r) < 1e-9 ? r : v;
}

/** Arredondamento "half away from zero" (round(-0.5) = -1), igual ao `round` de C/Pascal usado nos slides. */
export function round(v: number): number {
  return v < 0 ? -Math.round(-v) : Math.round(v);
}

/** Formata um número para exibição (inteiros sem casas; reais com até 3 casas). */
export function formatarNumero(v: number): string {
  const q = quaseInteiro(v);
  return Number.isInteger(q) ? String(q) : arredondar(q, 3).toString();
}

/** Gera um identificador curto e único (suficiente para objetos da cena). */
let contadorId = 0;
export function gerarId(prefixo = 'obj'): string {
  contadorId += 1;
  return `${prefixo}-${Date.now().toString(36)}-${contadorId}`;
}
