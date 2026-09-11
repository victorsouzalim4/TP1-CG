/**
 * Hook que traduz eventos de ponteiro (mouse e toque) sobre o canvas em eventos de célula:
 *
 *  - pointerdown  guarda a célula inicial e captura o ponteiro (o arrasto continua mesmo fora do canvas);
 *  - pointermove  emite `onHover(célula)`; com o botão pressionado e `modoArrasto !== 'nenhum'`
 *                 emite `onArrastoMover(normalizarRetangulo(inicio, atual))`, com `atual` limitado à grade;
 *  - pointerup    na mesma célula do início (ou em modo 'nenhum') → `onClickCelula(inicio)`;
 *                 em célula diferente → `onArrastoFim(retângulo)`;
 *  - pointerleave / pointercancel → `onHover(null)` e cancela o arrasto em andamento.
 *
 * Os manipuladores devolvidos são estáveis (podem ser espalhados no `<canvas>` sem re-render);
 * as opções mais recentes ficam num ref atualizado a cada render.
 */
import { useLayoutEffect, useMemo, useRef, type PointerEvent as PointerEventReact, type RefObject } from 'react';
import type { Ponto, Retangulo } from '../../core/tipos';
import { normalizarRetangulo } from '../../core/geometria';
import { pxParaCelula, pxParaCelulaLimitada, type Viewport } from './desenhoGrade';

/** Tipo de arrasto que a ferramenta ativa espera da grade. */
export type ModoArrasto = 'nenhum' | 'selecao' | 'janela';

export interface OpcoesInteracaoGrade {
  /** Viewport atual (ref, para que os manipuladores nunca fiquem desatualizados). */
  viewportRef: RefObject<Viewport>;
  modoArrasto: ModoArrasto;
  onClickCelula?(p: Ponto): void;
  onArrastoMover?(r: Retangulo): void;
  onArrastoFim?(r: Retangulo): void;
  onHover?(p: Ponto | null): void;
}

type EventoPonteiro = PointerEventReact<HTMLElement>;

export interface ManipuladoresGrade {
  onPointerDown(e: EventoPonteiro): void;
  onPointerMove(e: EventoPonteiro): void;
  onPointerUp(e: EventoPonteiro): void;
  onPointerLeave(e: EventoPonteiro): void;
  onPointerCancel(e: EventoPonteiro): void;
}

interface ArrastoEmCurso {
  pointerId: number;
  inicio: Ponto;
  /** Última célula reportada em `onArrastoMover` (evita emissões repetidas). */
  ultimo: Ponto;
}

function mesmaCelula(a: Ponto | null, b: Ponto | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y;
}

/** Posição do ponteiro relativa ao canto superior-esquerdo do elemento alvo, em px CSS. */
function posicaoNoElemento(e: EventoPonteiro): { px: number; py: number } {
  const rect = e.currentTarget.getBoundingClientRect();
  return { px: e.clientX - rect.left, py: e.clientY - rect.top };
}

export function useInteracaoGrade(opcoes: OpcoesInteracaoGrade): ManipuladoresGrade {
  const opcoesRef = useRef(opcoes);
  useLayoutEffect(() => {
    opcoesRef.current = opcoes;
  });

  const arrastoRef = useRef<ArrastoEmCurso | null>(null);
  const hoverRef = useRef<Ponto | null>(null);

  return useMemo<ManipuladoresGrade>(() => {
    /** Emite `onHover` apenas quando a célula muda. */
    function atualizarHover(celula: Ponto | null): void {
      if (mesmaCelula(hoverRef.current, celula)) return;
      hoverRef.current = celula;
      opcoesRef.current.onHover?.(celula);
    }

    return {
      onPointerDown(e) {
        // Só o botão principal (mouse) ou o primeiro toque.
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (arrastoRef.current) return;
        const { px, py } = posicaoNoElemento(e);
        const celula = pxParaCelula(opcoesRef.current.viewportRef.current, px, py);
        if (!celula) return;
        arrastoRef.current = { pointerId: e.pointerId, inicio: celula, ultimo: celula };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Alguns ambientes (testes) não implementam captura; o arrasto funciona mesmo assim.
        }
      },

      onPointerMove(e) {
        const o = opcoesRef.current;
        const vp = o.viewportRef.current;
        const { px, py } = posicaoNoElemento(e);
        const arrasto = arrastoRef.current;
        if (arrasto && arrasto.pointerId === e.pointerId && o.modoArrasto !== 'nenhum') {
          const atual = pxParaCelulaLimitada(vp, px, py);
          if (!atual) return;
          atualizarHover(atual);
          if (!mesmaCelula(atual, arrasto.ultimo)) {
            arrasto.ultimo = atual;
            o.onArrastoMover?.(normalizarRetangulo(arrasto.inicio, atual));
          }
          return;
        }
        atualizarHover(pxParaCelula(vp, px, py));
      },

      onPointerUp(e) {
        const o = opcoesRef.current;
        const arrasto = arrastoRef.current;
        if (!arrasto || arrasto.pointerId !== e.pointerId) return;
        arrastoRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // idem
        }
        if (o.modoArrasto === 'nenhum') {
          o.onClickCelula?.(arrasto.inicio);
          return;
        }
        const { px, py } = posicaoNoElemento(e);
        const fim = pxParaCelulaLimitada(o.viewportRef.current, px, py) ?? arrasto.inicio;
        if (mesmaCelula(fim, arrasto.inicio)) o.onClickCelula?.(arrasto.inicio);
        else o.onArrastoFim?.(normalizarRetangulo(arrasto.inicio, fim));
      },

      onPointerLeave() {
        // Com captura de ponteiro, este evento só chega depois do pointerup; sem captura,
        // sair do canvas cancela o arrasto em andamento.
        arrastoRef.current = null;
        atualizarHover(null);
      },

      onPointerCancel() {
        arrastoRef.current = null;
        atualizarHover(null);
      },
    };
  }, []);
}
