/**
 * Contrato das ferramentas de interação por clique/arrasto sobre a grade.
 *
 * Uma ferramenta não conhece o store: o módulo passa callbacks (`aoConcluir`, `aoSelecionar`…)
 * e liga o objeto devolvido ao `PixelGrid` (ver `propsGradeDaFerramenta`) e à `BarraStatus`
 * (`instrucao`). Os `overlays` são o preview da ferramenta (ponto fixado, segmento até o hover…)
 * e devem ser concatenados aos overlays do passo atual do algoritmo.
 */
import type { Overlay, Ponto, Retangulo } from '../core/tipos';
import type { ModoArrasto } from '../componentes/grade/useInteracaoGrade';
import type { PixelGridProps } from '../componentes/grade/PixelGrid';

export type { ModoArrasto };

export interface Ferramenta {
  /** Instrução curta para a barra de status ("Clique no ponto final P2"). */
  instrucao: string;
  /** Preview da ferramenta (overlays temporários). */
  overlays: Overlay[];
  /** Que tipo de arrasto a grade deve reconhecer enquanto esta ferramenta está ativa. */
  modoArrasto: ModoArrasto;
  aoClicarCelula(p: Ponto): void;
  aoArrastoMover?(r: Retangulo): void;
  aoArrastoFim?(r: Retangulo): void;
  /** Descarta o estado parcial (ex.: P1 já fixado). */
  cancelar(): void;
}

/** Ferramenta que ignora tudo (para quando um algoritmo está em execução). */
export const FERRAMENTA_INATIVA: Ferramenta = {
  instrucao: '',
  overlays: [],
  modoArrasto: 'nenhum',
  aoClicarCelula() {
    /* nada */
  },
  cancelar() {
    /* nada */
  },
};

/** Igualdade de células. */
export function mesmoPonto(a: Ponto, b: Ponto): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Retângulo degenerado de uma única célula. */
export function retanguloDeCelula(p: Ponto): Retangulo {
  return { xmin: p.x, ymin: p.y, xmax: p.x, ymax: p.y };
}

/** Props do `PixelGrid` derivadas de uma ferramenta: `<PixelGrid {...propsGradeDaFerramenta(f)} … />`. */
export function propsGradeDaFerramenta(
  f: Ferramenta,
): Pick<PixelGridProps, 'modoArrasto' | 'onClickCelula' | 'onArrastoMover' | 'onArrastoFim'> {
  return {
    modoArrasto: f.modoArrasto,
    onClickCelula: f.aoClicarCelula,
    onArrastoMover: f.aoArrastoMover,
    onArrastoFim: f.aoArrastoFim,
  };
}
