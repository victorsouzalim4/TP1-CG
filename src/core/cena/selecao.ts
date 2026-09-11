/**
 * Seleção de objetos por região retangular (exigência do TP: vértices, retas e polígonos
 * selecionáveis por uma janela arrastada sobre a grade).
 */
import type { Retangulo } from '../tipos';
import { dentroDoRetangulo } from '../geometria';
import { selecionavel, verticesDe, type ObjetoGrafico } from './objetos';

/**
 * Ids dos objetos selecionáveis cujos vértices estão TODOS dentro de `r` (limites inclusivos).
 * Os vértices reais (após transformações) são comparados diretamente, sem arredondar; a
 * circunferência conta apenas pelo centro; preenchimentos nunca são selecionáveis.
 */
export function objetosNaRegiao(objetos: ObjetoGrafico[], r: Retangulo): string[] {
  return objetos
    .filter((obj) => {
      if (!selecionavel(obj)) return false;
      const vertices = verticesDe(obj);
      // Um objeto sem vértices (polígono vazio) não pode ser considerado "todo dentro".
      return vertices.length > 0 && vertices.every((v) => dentroDoRetangulo(v, r));
    })
    .map((obj) => obj.id);
}

/** Devolve a lista com `selecionado` = (id ∈ ids). Objetos cujo estado não muda são reaproveitados. */
export function aplicarSelecao(objetos: ObjetoGrafico[], ids: readonly string[]): ObjetoGrafico[] {
  const conjunto = new Set(ids);
  return objetos.map((obj) => {
    const selecionado = conjunto.has(obj.id);
    return selecionado === obj.selecionado ? obj : { ...obj, selecionado };
  });
}
