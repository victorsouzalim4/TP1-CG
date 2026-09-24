/**
 * Layout completo de um módulo já ligado ao store. O módulo informa apenas o painel lateral, a
 * ferramenta ativa e os extras; barra de ferramentas, grade, status e transporte vêm prontos.
 *
 *   <ModuloConectado painel={…} ferramenta={reta} />
 */
import type { ReactNode } from 'react';
import type { Overlay, Retangulo } from '../../core/tipos';
import type { Ferramenta } from '../../ferramentas/tipos';
import { useStore } from '../../estado/store';
import { LayoutModulo } from '../layout/LayoutModulo';
import { BarraStatus } from '../layout/BarraStatus';
import { BarraFerramentasConectada } from './BarraFerramentasConectada';
import { GradeConectada } from './GradeConectada';
import { TransporteConectado } from './TransporteConectado';

export interface ModuloConectadoProps {
  painel: ReactNode;
  ferramenta: Ferramenta;
  /** Overlays próprios do módulo (sempre visíveis). */
  overlays?: Overlay[];
  /** Retângulo de arrasto em andamento (seleção ou janela). */
  regiaoArrasto?: Retangulo | null;
  /** Desenha a janela de recorte da cena. */
  mostrarJanela?: boolean;
  /** Mensagem de erro/aviso na barra de status. */
  aviso?: string;
  /** Controles do módulo alinhados à direita da barra de ferramentas. */
  extrasToolbar?: ReactNode;
}

export function ModuloConectado({ painel, ferramenta, overlays, regiaoArrasto, mostrarJanela, aviso, extrasToolbar }: ModuloConectadoProps) {
  const hover = useStore((s) => s.ui.hover);

  return (
    <LayoutModulo
      painel={painel}
      toolbar={<BarraFerramentasConectada extras={extrasToolbar} />}
      grade={<GradeConectada ferramenta={ferramenta} overlays={overlays} regiaoArrasto={regiaoArrasto} mostrarJanela={mostrarJanela} />}
      status={<BarraStatus hover={hover} instrucao={ferramenta.instrucao} aviso={aviso} />}
      transporte={<TransporteConectado />}
    />
  );
}
