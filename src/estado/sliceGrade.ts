/**
 * Slice "grade": dimensões da matriz de pixels e posição da origem.
 *
 * A célula (0, 0) fica a `origem.x` colunas e `origem.y` linhas do canto inferior-esquerdo da
 * grade. Com `modoOrigem = 'canto'` a origem é (0, 0); com `'centro'` fica no meio, permitindo
 * coordenadas negativas (útil para rotações e reflexões em torno da origem).
 */
import type { StateCreator } from 'zustand';
import type { Ponto } from '../core/tipos';
import type { Estado } from './store';

export type ModoOrigem = 'canto' | 'centro';

export interface EstadoGrade {
  largura: number;
  altura: number;
  origem: Ponto;
  modoOrigem: ModoOrigem;
  mostrarEixos: boolean;
}

export interface SliceGrade {
  grade: EstadoGrade;
  /** Redimensiona a grade (recalcula a origem conforme `modoOrigem`) e encerra a depuração. */
  definirTamanho(largura: number, altura: number): void;
  definirModoOrigem(modo: ModoOrigem): void;
  alternarEixos(): void;
}

export const TAMANHO_MIN = 2;
export const TAMANHO_MAX = 500;

export function calcularOrigem(largura: number, altura: number, modo: ModoOrigem): Ponto {
  return modo === 'centro' ? { x: Math.floor(largura / 2), y: Math.floor(altura / 2) } : { x: 0, y: 0 };
}

function limitarTamanho(v: number): number {
  const inteiro = Math.round(Number.isFinite(v) ? v : TAMANHO_MIN);
  return Math.min(TAMANHO_MAX, Math.max(TAMANHO_MIN, inteiro));
}

export const GRADE_INICIAL: EstadoGrade = {
  largura: 40,
  altura: 30,
  origem: { x: 0, y: 0 },
  modoOrigem: 'canto',
  mostrarEixos: true,
};

export const criarSliceGrade: StateCreator<Estado, [], [], SliceGrade> = (set, get) => ({
  grade: GRADE_INICIAL,

  definirTamanho(largura, altura) {
    const l = limitarTamanho(largura);
    const a = limitarTamanho(altura);
    // Os pixels de uma sessão foram calculados para a grade antiga: encerra para não exibir lixo.
    get().encerrarDepuracao();
    set((s) => ({
      grade: { ...s.grade, largura: l, altura: a, origem: calcularOrigem(l, a, s.grade.modoOrigem) },
    }));
  },

  definirModoOrigem(modo) {
    set((s) => ({
      grade: { ...s.grade, modoOrigem: modo, origem: calcularOrigem(s.grade.largura, s.grade.altura, modo) },
    }));
  },

  alternarEixos() {
    set((s) => ({ grade: { ...s.grade, mostrarEixos: !s.grade.mostrarEixos } }));
  },
});
