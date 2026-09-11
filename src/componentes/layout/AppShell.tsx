/**
 * Esqueleto da aplicação: grid `280px 1fr 340px` × `44px 1fr`, 100vh, sem rolagem externa.
 *
 * A área lateral recebe `lateral` (normalmente a `ListaModulos`) e, abaixo, um slot vazio no qual
 * o `LayoutModulo` do módulo ativo (renderizado em `centro`) insere seu painel via portal.
 * Assim cada módulo continua sendo um único componente, mesmo ocupando duas áreas do shell.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ContextoSlotLateral } from './slotLateral';
import './layout.css';

export interface AppShellProps {
  cabecalho: ReactNode;
  lateral: ReactNode;
  centro: ReactNode;
  direita: ReactNode;
}

export function AppShell({ cabecalho, lateral, centro, direita }: AppShellProps) {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null);
  const slot = useMemo(() => ({ alvo }), [alvo]);

  return (
    <ContextoSlotLateral.Provider value={slot}>
      <div className="app-shell">
        <header className="app-shell__cabecalho">{cabecalho}</header>
        <aside className="app-shell__lateral" aria-label="Módulos e parâmetros">
          {lateral}
          <div className="app-shell__slot-painel" ref={setAlvo} />
        </aside>
        <main className="app-shell__centro">{centro}</main>
        <aside className="app-shell__direita" aria-label="Depuração">
          {direita}
        </aside>
      </div>
    </ContextoSlotLateral.Provider>
  );
}
