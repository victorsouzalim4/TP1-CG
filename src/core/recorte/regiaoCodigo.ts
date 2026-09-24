/**
 * Código de região (region code) do Cohen-Sutherland — slides "CG 07 Recorte", slides 9 e 13.
 *
 * Cada extremo P = (x, y) recebe 4 bits, um por fronteira da janela:
 *
 *   bit 0 (E, valor 1): x < xmin   — à esquerda
 *   bit 1 (D, valor 2): x > xmax   — à direita
 *   bit 2 (B, valor 4): y < ymin   — abaixo
 *   bit 3 (C, valor 8): y > ymax   — acima
 *
 * Lido do bit mais significativo ao menos (C B D E), o plano fica dividido em 9 regiões:
 *
 *   1001 | 1000 | 1010
 *   0001 | 0000 | 0010
 *   0101 | 0100 | 0110
 *
 * Os limites da janela são tratados como coordenadas reais (retas que passam pelo centro das
 * células xmin, xmax, ymin e ymax), exatamente como nos slides.
 */
import type { Ponto, Retangulo, Valor } from '../tipos';

export const BIT_ESQUERDA = 1;
export const BIT_DIREITA = 2;
export const BIT_BAIXO = 4;
export const BIT_CIMA = 8;

/** Rótulos dos bits, do mais significativo (bit 3) ao menos significativo (bit 0). */
export const ROTULOS_BITS = ['C', 'B', 'D', 'E'];

/** `region_code(x, y)` dos slides, com a janela explícita. */
export function region_code(x: number, y: number, janela: Retangulo): number {
  let codigo = 0;
  if (x < janela.xmin) codigo += BIT_ESQUERDA;
  if (x > janela.xmax) codigo += BIT_DIREITA;
  if (y < janela.ymin) codigo += BIT_BAIXO;
  if (y > janela.ymax) codigo += BIT_CIMA;
  return codigo;
}

/** `bit(c, n)` dos slides: 1 se o bit n de c está ligado, senão 0. */
export function bit(codigo: number, n: number): number {
  return (codigo >> n) & 1;
}

/** Código em binário com 4 dígitos, ex.: 9 → "1001". */
export function formatarCodigo(codigo: number): string {
  return codigo.toString(2).padStart(4, '0');
}

/** Valor `bits` para o painel "Variáveis". */
export function bitsDe(codigo: number): Valor {
  return { tipo: 'bits', valor: codigo, rotulos: ROTULOS_BITS };
}

/** Nome da região em pt-BR (ex.: 9 → "acima e à esquerda"). */
export function nomeDaRegiao(codigo: number): string {
  if (codigo === 0) return 'dentro da janela';
  const vertical = bit(codigo, 3) ? 'acima' : bit(codigo, 2) ? 'abaixo' : '';
  const horizontal = bit(codigo, 0) ? 'à esquerda' : bit(codigo, 1) ? 'à direita' : '';
  return vertical && horizontal ? `${vertical} e ${horizontal}` : vertical || horizontal;
}

export interface RotuloRegiao extends Ponto {
  codigo: number;
  texto: string;
}

/**
 * Posições (centro da parte visível) dos rótulos das 9 regiões, em coordenadas de célula.
 * `limites` é a área visível da grade; regiões sem nenhuma célula visível são omitidas.
 */
export function rotulosDasRegioes(janela: Retangulo, limites: Retangulo): RotuloRegiao[] {
  // Faixas inclusivas de células de cada coluna/linha, com o bit correspondente.
  const colunas: Array<[number, number, number]> = [
    [limites.xmin, janela.xmin - 1, BIT_ESQUERDA],
    [janela.xmin, janela.xmax, 0],
    [janela.xmax + 1, limites.xmax, BIT_DIREITA],
  ];
  const linhas: Array<[number, number, number]> = [
    [janela.ymax + 1, limites.ymax, BIT_CIMA],
    [janela.ymin, janela.ymax, 0],
    [limites.ymin, janela.ymin - 1, BIT_BAIXO],
  ];
  const rotulos: RotuloRegiao[] = [];
  for (const [y0, y1, bitY] of linhas) {
    const ya = Math.max(y0, limites.ymin);
    const yb = Math.min(y1, limites.ymax);
    if (ya > yb) continue;
    for (const [x0, x1, bitX] of colunas) {
      const xa = Math.max(x0, limites.xmin);
      const xb = Math.min(x1, limites.xmax);
      if (xa > xb) continue;
      const codigo = bitY + bitX;
      rotulos.push({ codigo, texto: formatarCodigo(codigo), x: (xa + xb) / 2, y: (ya + yb) / 2 });
    }
  }
  return rotulos;
}
