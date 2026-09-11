/**
 * Slice "ui": módulo ativo, aba do painel direito, cor de desenho atual e célula sob o mouse.
 *
 * `ModuloId` é importado só como tipo: `modulos/registro.ts` importa os componentes React e não
 * deve ser carregado pelo store (o core e os testes rodam sem React).
 */
import type { StateCreator } from 'zustand';
import type { Ponto } from '../core/tipos';
import { COR_PADRAO } from '../core/cores';
import type { ModuloId } from '../modulos/registro';
import type { Estado } from './store';

export type AbaDireita = 'codigo' | 'variaveis' | 'objetos';

export interface EstadoUI {
  moduloAtivo: ModuloId;
  abaDireita: AbaDireita;
  /** Cor de desenho escolhida na paleta (hex). */
  corAtual: string;
  /** Célula sob o cursor (para o rodapé "x, y"), ou null fora da grade. */
  hover: Ponto | null;
}

export interface SliceUI {
  ui: EstadoUI;
  /** Troca de módulo: encerra a depuração e limpa a seleção, mas mantém objetos e janela de recorte. */
  ativarModulo(id: ModuloId): void;
  definirAba(aba: AbaDireita): void;
  definirCorAtual(cor: string): void;
  definirHover(p: Ponto | null): void;
}

/** Igual a `MODULO_PADRAO` de `modulos/registro.ts` (repetido aqui para não importar React no store). */
const MODULO_INICIAL: ModuloId = 'dda';

export const UI_INICIAL: EstadoUI = {
  moduloAtivo: MODULO_INICIAL,
  abaDireita: 'codigo',
  corAtual: COR_PADRAO,
  hover: null,
};

export const criarSliceUI: StateCreator<Estado, [], [], SliceUI> = (set, get) => ({
  ui: UI_INICIAL,

  ativarModulo(id) {
    get().encerrarDepuracao();
    get().limparSelecao();
    set((s) => ({ ui: { ...s.ui, moduloAtivo: id } }));
  },

  definirAba(aba) {
    set((s) => ({ ui: { ...s.ui, abaDireita: aba } }));
  },

  definirCorAtual(cor) {
    set((s) => ({ ui: { ...s.ui, corAtual: cor } }));
  },

  definirHover(p) {
    set((s) => {
      const atual = s.ui.hover;
      // Evita re-render a cada movimento do mouse dentro da mesma célula.
      if (atual === p || (atual && p && atual.x === p.x && atual.y === p.y)) return s;
      return { ui: { ...s.ui, hover: p } };
    });
  },
});
