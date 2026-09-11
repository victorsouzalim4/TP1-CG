/**
 * Contexto do "slot lateral": o `AppShell` publica aqui o elemento DOM (abaixo da lista de
 * módulos) onde o `LayoutModulo` insere o painel do módulo via portal.
 *
 * Valores:
 *  - `undefined`     → não há AppShell acima (o LayoutModulo renderiza o painel embutido);
 *  - `{ alvo: null }` → AppShell montando (o elemento ainda não existe; espera o próximo render);
 *  - `{ alvo: el }`   → destino do portal.
 */
import { createContext, useContext } from 'react';

export interface SlotLateral {
  alvo: HTMLElement | null;
}

export const ContextoSlotLateral = createContext<SlotLateral | undefined>(undefined);

export function useSlotLateral(): SlotLateral | undefined {
  return useContext(ContextoSlotLateral);
}
