/**
 * Tipos compartilhados pelos algoritmos de recorte de retas (Cohen-Sutherland e Liang-Barsky).
 */
import type { Pixel, Retangulo } from '../tipos';
import type { ParametrosReta } from '../rasterizacao/dda';

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
