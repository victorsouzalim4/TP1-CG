/**
 * `PixelGrid` ligado ao store: dimensões e origem da grade, pixels da cena (camada base),
 * pixels e overlays do passo atual da depuração, destaque dos objetos selecionados e hover.
 *
 * O módulo informa só o que é dele: a ferramenta ativa (cliques/arrasto e preview), overlays
 * próprios (ex.: rótulos das regiões do recorte) e o retângulo de arrasto em andamento.
 */
import { useMemo } from 'react';
import type { Overlay, Pixel, Retangulo } from '../../core/tipos';
import { useStore } from '../../estado/store';
import { usePixelsBase, usePixelsSelecionados, useQuadroAtual } from '../../estado/seletores';
import { propsGradeDaFerramenta, type Ferramenta } from '../../ferramentas/tipos';
import { PixelGrid } from '../grade/PixelGrid';

export interface GradeConectadaProps {
  ferramenta: Ferramenta;
  /** Overlays do módulo, desenhados por baixo dos overlays do passo e do preview da ferramenta. */
  overlays?: Overlay[];
  /** Retângulo de arrasto em andamento (seleção ou janela), tracejado. */
  regiaoArrasto?: Retangulo | null;
  /** Desenha a janela de recorte guardada na cena (módulos de recorte). */
  mostrarJanela?: boolean;
}

const SEM_PIXELS: Pixel[] = [];
const SEM_OVERLAYS: Overlay[] = [];

export function GradeConectada({ ferramenta, overlays = SEM_OVERLAYS, regiaoArrasto = null, mostrarJanela = false }: GradeConectadaProps) {
  const grade = useStore((s) => s.grade);
  const janelaRecorte = useStore((s) => s.cena.janelaRecorte);
  const corAtual = useStore((s) => s.ui.corAtual);
  const definirHover = useStore((s) => s.definirHover);
  const base = usePixelsBase();
  const selecionados = usePixelsSelecionados();
  const quadro = useQuadroAtual();

  const overlaysFerramenta = ferramenta.overlays;
  const camadas = useMemo(
    () => ({
      base,
      algoritmo: quadro?.pixels ?? SEM_PIXELS,
      overlays: [...overlays, ...(quadro?.overlays ?? SEM_OVERLAYS), ...overlaysFerramenta],
    }),
    [base, quadro, overlays, overlaysFerramenta],
  );

  return (
    <PixelGrid
      largura={grade.largura}
      altura={grade.altura}
      origem={grade.origem}
      mostrarEixos={grade.mostrarEixos}
      camadas={camadas}
      corPadrao={corAtual}
      destaqueSelecao={selecionados}
      regiaoSelecao={regiaoArrasto}
      janelaRecorte={mostrarJanela ? janelaRecorte : null}
      onHover={definirHover}
      {...propsGradeDaFerramenta(ferramenta)}
    />
  );
}
