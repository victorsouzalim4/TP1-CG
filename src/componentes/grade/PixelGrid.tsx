/**
 * Matriz de pixels: dois `<canvas>` empilhados num container que ocupa 100% do pai.
 *
 *  - Camada ESTÁTICA: grade, eixos, rótulos e `camadas.base` (objetos já desenhados).
 *    Redesenhada apenas quando largura/altura/origem/base/mostrarEixos/viewport mudam.
 *  - Camada DINÂMICA: `camadas.algoritmo`, `overlays`, destaque de seleção, região de seleção,
 *    janela de recorte e hover. Redesenhada via `requestAnimationFrame` coalescido.
 *
 * O hover é estado interno (ref): mover o mouse não provoca re-render React, apenas agenda um
 * redesenho da camada dinâmica e notifica `onHover` quando a célula muda.
 * Componente puramente presentacional: não conhece store nem depurador.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Overlay, Pixel, Ponto, Retangulo } from '../../core/tipos';
import { COR_OVERLAY, COR_PADRAO } from '../../core/cores';
import {
  calcularViewport,
  desenharContornoCelulas,
  desenharGrade,
  desenharHover,
  desenharOverlays,
  desenharPixels,
  desenharRetangulo,
  prepararCanvas,
  type Viewport,
} from './desenhoGrade';
import { useInteracaoGrade, type ModoArrasto } from './useInteracaoGrade';
import './grade.css';

export type { ModoArrasto } from './useInteracaoGrade';

/** Camadas de pixels/overlays exibidas pela grade. */
export interface CamadasGrade {
  /** Pixels dos objetos da cena (camada estática). */
  base: Pixel[];
  /** Pixels acumulados pelo algoritmo em execução (camada dinâmica). */
  algoritmo: Pixel[];
  /** Anotações do passo atual. */
  overlays: Overlay[];
}

export interface PixelGridProps {
  largura: number;
  altura: number;
  origem: Ponto;
  camadas: CamadasGrade;
  /** Cor aplicada aos pixels sem `cor`. Padrão: `COR_PADRAO`. */
  corPadrao?: string;
  /** Pixels dos objetos selecionados: contorno azul (`COR_OVERLAY.selecao`). */
  destaqueSelecao?: Pixel[];
  /** Retângulo de seleção em andamento: tracejado azul. */
  regiaoSelecao?: Retangulo | null;
  /** Janela de recorte: contorno vermelho (`COR_OVERLAY.janela`) com rótulo "janela". */
  janelaRecorte?: Retangulo | null;
  modoArrasto: ModoArrasto;
  /** Padrão: `true`. */
  mostrarEixos?: boolean;
  onClickCelula?(p: Ponto): void;
  onArrastoMover?(r: Retangulo): void;
  onArrastoFim?(r: Retangulo): void;
  onHover?(p: Ponto | null): void;
}

/** Dados lidos pelo redesenho dinâmico (guardados em ref para o callback do rAF). */
interface DadosDinamicos {
  vp: Viewport;
  algoritmo: Pixel[];
  overlays: Overlay[];
  destaqueSelecao: Pixel[] | undefined;
  regiaoSelecao: Retangulo | null;
  janelaRecorte: Retangulo | null;
  corPadrao: string;
}

export function PixelGrid({
  largura,
  altura,
  origem,
  camadas,
  corPadrao = COR_PADRAO,
  destaqueSelecao,
  regiaoSelecao = null,
  janelaRecorte = null,
  modoArrasto,
  mostrarEixos = true,
  onClickCelula,
  onArrastoMover,
  onArrastoFim,
  onHover,
}: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasEstaticoRef = useRef<HTMLCanvasElement>(null);
  const canvasDinamicoRef = useRef<HTMLCanvasElement>(null);

  // Tamanho do container em px CSS (atualizado pelo ResizeObserver).
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const { x: origemX, y: origemY } = origem;
  const vp = useMemo(
    () => calcularViewport(tamanho, largura, altura, { x: origemX, y: origemY }),
    [tamanho, largura, altura, origemX, origemY],
  );
  const vpRef = useRef<Viewport>(vp);

  // Refs com os dados mais recentes, lidos fora do ciclo de render (rAF e eventos).
  const hoverRef = useRef<Ponto | null>(null);
  const dadosRef = useRef<DadosDinamicos>({
    vp,
    algoritmo: camadas.algoritmo,
    overlays: camadas.overlays,
    destaqueSelecao,
    regiaoSelecao,
    janelaRecorte,
    corPadrao,
  });
  useLayoutEffect(() => {
    vpRef.current = vp;
    dadosRef.current = {
      vp,
      algoritmo: camadas.algoritmo,
      overlays: camadas.overlays,
      destaqueSelecao,
      regiaoSelecao,
      janelaRecorte,
      corPadrao,
    };
  });

  // --- Camada dinâmica (rAF coalescido) --------------------------------------
  const rafRef = useRef<number | null>(null);

  const desenharDinamico = useCallback(() => {
    const canvas = canvasDinamicoRef.current;
    if (!canvas) return;
    const d = dadosRef.current;
    const ctx = prepararCanvas(canvas, d.vp);
    if (!ctx || d.vp.tamanhoCelula <= 0) return;
    desenharPixels(d.vp, ctx, d.algoritmo, d.corPadrao);
    if (d.destaqueSelecao && d.destaqueSelecao.length > 0) {
      desenharContornoCelulas(d.vp, ctx, d.destaqueSelecao, COR_OVERLAY.selecao);
    }
    desenharOverlays(d.vp, ctx, d.overlays);
    if (d.janelaRecorte) desenharRetangulo(d.vp, ctx, d.janelaRecorte, COR_OVERLAY.janela, false, 'janela');
    if (d.regiaoSelecao) desenharRetangulo(d.vp, ctx, d.regiaoSelecao, COR_OVERLAY.selecao, true);
    if (hoverRef.current) desenharHover(d.vp, ctx, hoverRef.current);
  }, []);

  const agendarRedesenho = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      desenharDinamico();
    });
  }, [desenharDinamico]);

  useEffect(() => {
    agendarRedesenho();
  }, [agendarRedesenho, vp, camadas.algoritmo, camadas.overlays, destaqueSelecao, regiaoSelecao, janelaRecorte, corPadrao]);

  useEffect(
    () => () => {
      // Zera o ref: no StrictMode o efeito é desmontado e remontado, e um id cancelado deixado
      // aqui faria `agendarRedesenho` achar que já há um quadro pendente e nunca mais desenhar.
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  // --- Camada estática ---------------------------------------------------------
  useEffect(() => {
    const canvas = canvasEstaticoRef.current;
    if (!canvas) return;
    const ctx = prepararCanvas(canvas, vp);
    if (!ctx || vp.tamanhoCelula <= 0) return;
    desenharGrade(vp, ctx, mostrarEixos);
    desenharPixels(vp, ctx, camadas.base, corPadrao);
  }, [vp, camadas.base, corPadrao, mostrarEixos]);

  // --- Observa o tamanho do container ---------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observador = new ResizeObserver((entradas) => {
      const r = entradas[0]?.contentRect;
      if (!r) return;
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      setTamanho((atual) => (atual.w === w && atual.h === h ? atual : { w, h }));
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // --- Interação ---------------------------------------------------------------------
  const manipuladores = useInteracaoGrade({
    viewportRef: vpRef,
    modoArrasto,
    onClickCelula,
    onArrastoMover,
    onArrastoFim,
    onHover: (p) => {
      hoverRef.current = p;
      agendarRedesenho();
      onHover?.(p);
    },
  });

  return (
    <div ref={containerRef} className="pixel-grid" data-modo-arrasto={modoArrasto}>
      <canvas ref={canvasEstaticoRef} className="pixel-grid__camada" aria-hidden="true" />
      <canvas
        ref={canvasDinamicoRef}
        className="pixel-grid__camada pixel-grid__camada--interativa"
        role="img"
        aria-label={`Matriz de pixels ${largura} por ${altura}`}
        {...manipuladores}
      />
    </div>
  );
}
