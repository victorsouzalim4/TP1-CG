/** Reexporta o contrato e os hooks das ferramentas de interação com a grade. */
export {
  FERRAMENTA_INATIVA,
  mesmoPonto,
  propsGradeDaFerramenta,
  retanguloDeCelula,
  type Ferramenta,
  type ModoArrasto,
} from './tipos';
export { useFerramentaClique, type OpcoesFerramentaClique } from './useFerramentaClique';
export { useFerramentaPonto, type OpcoesFerramentaPonto } from './useFerramentaPonto';
export { useFerramentaPivo, type OpcoesFerramentaPivo } from './useFerramentaPivo';
export { useFerramentaSemente, type OpcoesFerramentaSemente } from './useFerramentaSemente';
export { useFerramentaReta, type OpcoesFerramentaReta, type FerramentaReta } from './useFerramentaReta';
export { useFerramentaCirculo, type OpcoesFerramentaCirculo, type FerramentaCirculo } from './useFerramentaCirculo';
export { useFerramentaPoligono, type OpcoesFerramentaPoligono, type FerramentaPoligono } from './useFerramentaPoligono';
export { useFerramentaSelecao, type OpcoesFerramentaSelecao, type FerramentaSelecao } from './useFerramentaSelecao';
export { useFerramentaJanela, type OpcoesFerramentaJanela, type FerramentaJanela } from './useFerramentaJanela';
