/**
 * Store global (zustand 5) montado a partir de quatro slices: grade, cena, depuracao e ui.
 *
 * O estado fica aninhado por slice (`s.grade`, `s.cena`, ...) e as ações ficam no nível raiz
 * (`s.adicionarObjeto(...)`), o que permite que uma ação de um slice chame ações de outro via
 * `get()` (ex.: `definirTamanho` encerra a depuração).
 *
 * Uso nos componentes: `const objetos = useStore((s) => s.cena.objetos);`
 * Fora de componentes (testes, timers): `useStore.getState().avancar()`.
 */
import { create } from 'zustand';
import { criarSliceGrade, GRADE_INICIAL, type SliceGrade } from './sliceGrade';
import { criarSliceCena, CENA_INICIAL, type SliceCena } from './sliceCena';
import { criarSliceDepuracao, DEPURACAO_INICIAL, type SliceDepuracao } from './sliceDepuracao';
import { criarSliceUI, UI_INICIAL, type SliceUI } from './sliceUI';

export type Estado = SliceGrade & SliceCena & SliceDepuracao & SliceUI;

export const useStore = create<Estado>()((...a) => ({
  ...criarSliceGrade(...a),
  ...criarSliceCena(...a),
  ...criarSliceDepuracao(...a),
  ...criarSliceUI(...a),
}));

/** Valores iniciais de todos os slices (sem as ações). */
export function estadoInicial(): Pick<Estado, 'grade' | 'cena' | 'depuracao' | 'ui'> {
  return { grade: GRADE_INICIAL, cena: CENA_INICIAL, depuracao: DEPURACAO_INICIAL, ui: UI_INICIAL };
}

/** Volta o store ao estado inicial (usado nos testes e em "Novo documento"). */
export function reiniciarStore(): void {
  useStore.setState(estadoInicial());
}
