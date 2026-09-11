/**
 * Layout padrão de um módulo: painel de parâmetros (lateral) + centro (toolbar / grade / status /
 * transporte).
 *
 * Como a lateral e o centro são áreas diferentes do `AppShell`, o painel é enviado por PORTAL para
 * o slot que o AppShell publica no `ContextoSlotLateral`; o restante é renderizado no lugar
 * (dentro de `centro`). O módulo, portanto, continua sendo um único componente:
 *
 *   <AppShell lateral={<ListaModulos …/>} centro={<ModuloAtivo/>} …/>
 *   // e dentro de ModuloAtivo:
 *   <LayoutModulo painel={…} toolbar={…} grade={<PixelGrid …/>} status={…} transporte={…}/>
 *
 * Fora de um AppShell (testes, storybook) o painel é renderizado embutido acima do centro.
 * Áreas opcionais omitidas não reservam espaço (a grade cresce).
 */
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSlotLateral } from './slotLateral';
import './layout.css';

export interface LayoutModuloProps {
  /** Conteúdo do painel lateral (parâmetros, instruções, botões). */
  painel: ReactNode;
  /** Barra de ferramentas acima da grade (40 px). */
  toolbar?: ReactNode;
  /** A grade de pixels (ocupa o espaço restante). */
  grade: ReactNode;
  /** Barra de status abaixo da grade (24 px). */
  status?: ReactNode;
  /** Controles de execução (56 px). */
  transporte?: ReactNode;
}

export function LayoutModulo({ painel, toolbar, grade, status, transporte }: LayoutModuloProps) {
  const slot = useSlotLateral();

  let painelRenderizado: ReactNode;
  if (slot === undefined) {
    painelRenderizado = <div className="layout-modulo__painel layout-modulo__painel--embutido">{painel}</div>;
  } else if (slot.alvo) {
    painelRenderizado = createPortal(<div className="layout-modulo__painel">{painel}</div>, slot.alvo);
  } else {
    painelRenderizado = null; // slot ainda não montado: aparece no próximo render
  }

  return (
    <>
      {painelRenderizado}
      <div className="layout-modulo__centro">
        {toolbar !== undefined && <div className="layout-modulo__toolbar">{toolbar}</div>}
        <div className="layout-modulo__grade">{grade}</div>
        {status !== undefined && <div className="layout-modulo__status">{status}</div>}
        {transporte !== undefined && <div className="layout-modulo__transporte">{transporte}</div>}
      </div>
    </>
  );
}
