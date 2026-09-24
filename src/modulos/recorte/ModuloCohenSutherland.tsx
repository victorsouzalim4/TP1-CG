/**
 * Módulo "Cohen-Sutherland" (slides "CG 07 Recorte", slides 9 a 13).
 */
import { algoritmoCohenSutherland } from '../../core/recorte/cohenSutherland';
import { PainelRecorte } from './PainelRecorte';

export function ModuloCohenSutherland() {
  return (
    <PainelRecorte
      algoritmo={algoritmoCohenSutherland}
      sobre={
        <p>
          Cada extremo recebe um código de 4 bits (<code>C B D E</code>: cima, baixo, direita, esquerda). Se{' '}
          <code>c1 = c2 = 0</code> a reta é aceita; se <code>c1 AND c2 ≠ 0</code> ela está toda fora e é rejeitada. Senão, o
          extremo de fora (<code>cfora</code>) é trocado pela interseção <code>(xint, yint)</code> com uma fronteira e o
          teste se repete.
        </p>
      }
    />
  );
}
