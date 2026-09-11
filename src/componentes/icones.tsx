/**
 * Ícones SVG inline (16×16, `currentColor`) usados pela interface.
 * Preferidos aos símbolos Unicode por renderizarem de forma idêntica em qualquer fonte/sistema.
 */
import type { ReactElement, SVGProps } from 'react';
import type { TipoObjeto } from '../core/cena/objetos';

export type PropsIcone = SVGProps<SVGSVGElement> & { tamanho?: number };

function Svg({ tamanho = 16, children, ...resto }: PropsIcone) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

// --- Transporte do depurador --------------------------------------------------------

/** ⏮ Reiniciar (voltar ao início). */
export function IconeReiniciar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="2" y="3" width="2" height="10" />
      <path d="M13 3v10L5 8z" />
    </Svg>
  );
}

/** ◀ Retroceder um passo. */
export function IconeRetroceder(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M11 3v10L4 8z" />
    </Svg>
  );
}

/** ▶ Executar. */
export function IconeExecutar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M4 2.5v11L13 8z" />
    </Svg>
  );
}

/** ⏸ Pausar. */
export function IconePausar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="3.5" height="10" />
      <rect x="9.5" y="3" width="3.5" height="10" />
    </Svg>
  );
}

/** ▶| Avançar um passo. */
export function IconeAvancar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M4 3v10l7-5z" />
      <rect x="12" y="3" width="2" height="10" />
    </Svg>
  );
}

/** ⏭ Ir ao fim. */
export function IconeIrAoFim(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M3 3v10l8-5z" />
      <rect x="12" y="3" width="2" height="10" />
    </Svg>
  );
}

// --- Ações gerais -----------------------------------------------------------------------

/** × Remover / fechar. */
export function IconeFechar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M4.2 3.1 8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
    </Svg>
  );
}

/** ✓ Marca de seleção. */
export function IconeMarca(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M6.4 11.6 2.9 8.1l1.2-1.2 2.3 2.3 5.5-5.5 1.2 1.2z" />
    </Svg>
  );
}

// --- Tipos de objeto da cena -----------------------------------------------------------

function IconePonto(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="8" r="2.5" />
    </Svg>
  );
}

function IconeReta(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M3 12.3 12.3 3l.7.7L3.7 13z" />
      <circle cx="3.5" cy="12.5" r="1.5" />
      <circle cx="12.5" cy="3.5" r="1.5" />
    </Svg>
  );
}

function IconePoligono(p: PropsIcone) {
  return (
    <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M8 2.5 13.5 6.5 11.5 13h-7L2.5 6.5z" />
    </Svg>
  );
}

function IconeCirculo(p: PropsIcone) {
  return (
    <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="5.5" />
    </Svg>
  );
}

function IconePreenchimento(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M2 2h12v12H2zm2 2v8h8V4z" fillRule="evenodd" />
      <path d="M5 5h6v6H5z" opacity="0.5" />
    </Svg>
  );
}

/** Ícone e nome legível de cada tipo de objeto. */
export const ICONES_OBJETO: Record<TipoObjeto, { Icone: (p: PropsIcone) => ReactElement; rotulo: string }> = {
  ponto: { Icone: IconePonto, rotulo: 'Ponto' },
  reta: { Icone: IconeReta, rotulo: 'Reta' },
  poligono: { Icone: IconePoligono, rotulo: 'Polígono' },
  circulo: { Icone: IconeCirculo, rotulo: 'Circunferência' },
  preenchimento: { Icone: IconePreenchimento, rotulo: 'Preenchimento' },
};
