/**
 * Seletores derivados do store. Cada hook seleciona só referências estáveis do estado e deriva o
 * valor com `useMemo`, evitando recalcular a rasterização a cada render.
 *
 * As funções puras (`limitesDaGrade`, `pixelsDaCena`) são exportadas para uso fora de React.
 */
import { useMemo } from 'react';
import type { Pixel, Retangulo } from '../core/tipos';
import type { ObjetoGrafico } from '../core/cena/objetos';
import { rasterizarObjeto } from '../core/rasterizacao/rasterizar';
import { montarQuadro, type Quadro } from '../depurador/sessao';
import { useStore } from './store';
import type { EstadoGrade } from './sliceGrade';

/** Limites inclusivos da grade em coordenadas de célula, dada a origem. */
export function limitesDaGrade(grade: Pick<EstadoGrade, 'largura' | 'altura' | 'origem'>): Retangulo {
  // `0 - x` em vez de `-x` para não produzir -0 quando a origem está no canto.
  return {
    xmin: 0 - grade.origem.x,
    ymin: 0 - grade.origem.y,
    xmax: grade.largura - 1 - grade.origem.x,
    ymax: grade.altura - 1 - grade.origem.y,
  };
}

/** Pixels de todos os objetos visíveis (os `ocultos` ficam de fora enquanto a depuração os redesenha). */
export function pixelsDaCena(objetos: readonly ObjetoGrafico[], ocultos: readonly string[] = []): Pixel[] {
  const ocultar = new Set(ocultos);
  const pixels: Pixel[] = [];
  for (const obj of objetos) {
    if (ocultar.has(obj.id)) continue;
    for (const px of rasterizarObjeto(obj)) pixels.push(px);
  }
  return pixels;
}

export function useLimitesGrade(): Retangulo {
  const grade = useStore((s) => s.grade);
  return useMemo(() => limitesDaGrade(grade), [grade]);
}

/** Pixels da cena base (todos os objetos não ocultos), rasterizados e com cor. */
export function usePixelsBase(): Pixel[] {
  const objetos = useStore((s) => s.cena.objetos);
  const ocultos = useStore((s) => s.depuracao.objetosOcultos);
  return useMemo(() => pixelsDaCena(objetos, ocultos), [objetos, ocultos]);
}

export function useObjetosSelecionados(): ObjetoGrafico[] {
  const objetos = useStore((s) => s.cena.objetos);
  return useMemo(() => objetos.filter((o) => o.selecionado), [objetos]);
}

/**
 * Pixels dos objetos selecionados (para o realce de seleção sobre a grade). Os ocultos pela
 * depuração ficam de fora: o realce não deve denunciar a forma original de um objeto que está
 * sendo redesenhado passo a passo.
 */
export function usePixelsSelecionados(): Pixel[] {
  const selecionados = useObjetosSelecionados();
  const ocultos = useStore((s) => s.depuracao.objetosOcultos);
  return useMemo(() => pixelsDaCena(selecionados, ocultos), [selecionados, ocultos]);
}

/** Quadro do passo atual da depuração, ou null sem sessão. */
export function useQuadroAtual(): Quadro | null {
  const sessao = useStore((s) => s.depuracao.sessao);
  const indice = useStore((s) => s.depuracao.indice);
  return useMemo(() => (sessao ? montarQuadro(sessao, indice) : null), [sessao, indice]);
}
