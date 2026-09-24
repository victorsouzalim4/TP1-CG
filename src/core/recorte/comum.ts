/**
 * Tipos compartilhados pelos algoritmos de recorte de retas (Cohen-Sutherland e Liang-Barsky),
 * mais os auxiliares de desenho das fronteiras da janela usados nos overlays dos dois.
 */
import type { Overlay, Pixel, Retangulo } from '../tipos';
import type { ParametrosReta } from '../rasterizacao/dda';
import { COR_OVERLAY } from '../cores';
import { formatarNumero } from '../geometria';

/** Reta a recortar mais a janela de recorte (limites inclusivos, em coordenadas de célula). */
export interface ParametrosRecorte extends ParametrosReta {
  janela: Retangulo;
}

/**
 * `aceito` = false quando a reta foi totalmente rejeitada (`segmento` nulo).
 * `pixels` são os pixels da parte visível, rasterizada após o recorte.
 */
export interface ResultadoRecorte {
  aceito: boolean;
  segmento: ParametrosReta | null;
  pixels: Pixel[];
}

/** "(x, y)" com até 3 casas. */
export function fmtPonto(x: number, y: number): string {
  return `(${formatarNumero(x)}, ${formatarNumero(y)})`;
}

/**
 * Área que cobre a janela e a reta original, com 1 célula de folga: comprimento usado para
 * desenhar as retas suporte das fronteiras (x = xmin, y = ymax...) além dos cantos da janela.
 */
export function extensao(j: Retangulo, x1: number, y1: number, x2: number, y2: number): Retangulo {
  return {
    xmin: Math.min(j.xmin, x1, x2) - 1,
    xmax: Math.max(j.xmax, x1, x2) + 1,
    ymin: Math.min(j.ymin, y1, y2) - 1,
    ymax: Math.max(j.ymax, y1, y2) + 1,
  };
}

/** Nome das fronteiras na ordem dos bits / de k: esquerda, direita, abaixo, acima. */
export const NOME_FRONTEIRA = ['esquerda (x = xmin)', 'direita (x = xmax)', 'abaixo (y = ymin)', 'acima (y = ymax)'] as const;

/** Reta suporte tracejada da fronteira `n` (0 = esquerda, 1 = direita, 2 = abaixo, 3 = acima). */
export function fronteira(n: number, j: Retangulo, ext: Retangulo): Overlay {
  const cor = COR_OVERLAY.janela;
  switch (n) {
    case 0:
      return { tipo: 'segmento', x1: j.xmin, y1: ext.ymin, x2: j.xmin, y2: ext.ymax, cor, tracejado: true };
    case 1:
      return { tipo: 'segmento', x1: j.xmax, y1: ext.ymin, x2: j.xmax, y2: ext.ymax, cor, tracejado: true };
    case 2:
      return { tipo: 'segmento', x1: ext.xmin, y1: j.ymin, x2: ext.xmax, y2: j.ymin, cor, tracejado: true };
    default:
      return { tipo: 'segmento', x1: ext.xmin, y1: j.ymax, x2: ext.xmax, y2: j.ymax, cor, tracejado: true };
  }
}
