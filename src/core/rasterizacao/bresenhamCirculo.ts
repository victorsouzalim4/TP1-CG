/**
 * Algoritmo de Bresenham para circunferências — slides "CG 06 Circ".
 *
 * Ideia dos slides: calcula-se apenas o arco do 2º octante (de x = 0 até x = y, 45°) e cada
 * ponto (x, y) é replicado nos 8 octantes por simetria (`plot_circle_points`). No arco, x cresce
 * 1 a cada iteração e a variável de decisão `p` (p0 = 3 − 2r) escolhe se y permanece ou decresce,
 * usando só aritmética inteira.
 *
 * Cada `yield` espelha UMA linha da listagem; `plot_circle_points` é um único passo (na linha
 * da chamada) que pinta os 8 pixels simétricos, rotulados de "1" a "8" na ordem da listagem.
 */
import { passo, type Algoritmo, type Overlay, type Passo, type Pixel, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import type { ResultadoRasterizacao } from './dda';

/** Centro (inteiro) e raio (inteiro, ≥ 0) da circunferência. */
export interface ParametrosCirculo {
  xc: number;
  yc: number;
  r: number;
}

export const CODIGO_BRESENHAM_CIRCULO = [
  'procedimento BresenhamCirculo(xc, yc, r)',
  '  x = 0',
  '  y = r',
  '  p = 3 - 2*r',
  '  plot_circle_points(xc, yc, x, y)',
  '  enquanto x < y faça',
  '    se p < 0 então p = p + 4*x + 6',
  '    senão p = p + 4*(x - y) + 10;  y = y - 1',
  '    x = x + 1',
  '    plot_circle_points(xc, yc, x, y)',
  '  fim-enquanto',
  '',
  'procedimento plot_circle_points(xc, yc, x, y)',
  '  set_pixel(xc + x, yc + y);  set_pixel(xc - x, yc + y)',
  '  set_pixel(xc + x, yc - y);  set_pixel(xc - x, yc - y)',
  '  set_pixel(xc + y, yc + x);  set_pixel(xc - y, yc + x)',
  '  set_pixel(xc + y, yc - x);  set_pixel(xc - y, yc - x)',
].join('\n');

/** Os 8 pontos simétricos de (x, y) em relação ao centro, na ordem da listagem `plot_circle_points`. */
export function pontosSimetricos(xc: number, yc: number, x: number, y: number): Pixel[] {
  return [
    { x: xc + x, y: yc + y },
    { x: xc - x, y: yc + y },
    { x: xc + x, y: yc - y },
    { x: xc - x, y: yc - y },
    { x: xc + y, y: yc + x },
    { x: xc - y, y: yc + x },
    { x: xc + y, y: yc - x },
    { x: xc - y, y: yc - x },
  ];
}

export const algoritmoBresenhamCirculo: Algoritmo<ParametrosCirculo, ResultadoRasterizacao> = {
  id: 'bresenham-circulo',
  nome: 'Bresenham (circunferência)',
  codigo: CODIGO_BRESENHAM_CIRCULO,

  *executar({ xc, yc, r }: ParametrosCirculo): Generator<Passo, ResultadoRasterizacao, void> {
    const pixels: Pixel[] = [];
    const v: Variaveis = { xc, yc, r };
    const snap = (): Variaveis => ({ ...v });
    // A circunferência ideal fica visível em todos os passos.
    const ideal: Overlay = { tipo: 'circulo-ideal', xc, yc, r, cor: COR_OVERLAY.ideal, tracejado: true };

    // `plot_circle_points`: um passo com os 8 pixels simétricos e uma célula rotulada por octante.
    const plot = (linha: number, x: number, y: number): Passo => {
      const oito = pontosSimetricos(xc, yc, x, y);
      for (const px of oito) pixels.push(px);
      const overlays: Overlay[] = [
        ideal,
        ...oito.map<Overlay>((px, i) => ({
          tipo: 'celula',
          x: px.x,
          y: px.y,
          cor: COR_OVERLAY.destaque,
          estilo: 'contorno',
          rotulo: String(i + 1),
        })),
      ];
      return passo(linha, snap(), {
        pixels: oito,
        overlays,
        descricao: `plot_circle_points: pinta os 8 simétricos de (x, y) = (${x}, ${y})`,
      });
    };

    // Linha 2: começa no topo da circunferência (x = 0, y = r)
    let x = 0;
    v.x = x;
    yield passo(2, snap(), { overlays: [ideal], descricao: 'x = 0 (início do arco, no topo)' });

    // Linha 3
    let y = r;
    v.y = y;
    yield passo(3, snap(), { overlays: [ideal], descricao: `y = r = ${r}` });

    // Linha 4: p0 = 3 − 2r (valor inicial da variável de decisão dos slides)
    let p = 3 - 2 * r;
    v.p = p;
    yield passo(4, snap(), { overlays: [ideal], descricao: `p = 3 − 2·r = ${p}` });

    // Linha 5: pinta os simétricos do ponto inicial
    yield plot(5, x, y);

    // Linhas 6-11: percorre o 2º octante até x alcançar y (45°)
    for (;;) {
      const continua = x < y;
      yield passo(6, snap(), {
        overlays: [ideal],
        descricao: continua
          ? `x < y (${x} < ${y}): continua o arco`
          : `x ≥ y (${x} ≥ ${y}): arco de 45° completo, encerra`,
      });
      if (!continua) break;

      if (p < 0) {
        // Linha 7: o ponto médio está dentro da circunferência → y mantém-se
        p += 4 * x + 6;
        v.p = p;
        yield passo(7, snap(), { overlays: [ideal], descricao: `p < 0: mantém y; p = p + 4·x + 6 = ${p}` });
      } else {
        // Linha 8: o ponto médio está fora → y decresce
        p += 4 * (x - y) + 10;
        y -= 1;
        v.p = p;
        v.y = y;
        yield passo(8, snap(), {
          overlays: [ideal],
          descricao: `p ≥ 0: decrementa y; p = p + 4·(x − y) + 10 = ${p}`,
        });
      }

      // Linha 9: x avança sempre
      x += 1;
      v.x = x;
      yield passo(9, snap(), { overlays: [ideal], descricao: `x = x + 1 = ${x}` });

      // Linha 10
      yield plot(10, x, y);
    }

    return { pixels };
  },
};
