/**
 * Módulo "Liang-Barsky" (slides "CG 07 Recorte", slides 14 a 21).
 */
import { algoritmoLiangBarsky } from '../../core/recorte/liangBarsky';
import { PainelRecorte } from './PainelRecorte';

export function ModuloLiangBarsky() {
  return (
    <PainelRecorte
      algoritmo={algoritmoLiangBarsky}
      sobre={
        <p>
          Usa a forma paramétrica <code>P(u) = P1 + u·(P2 − P1)</code>. Para cada fronteira k, <code>cliptest(p, q)</code>{' '}
          calcula <code>r = q / p</code>: se <code>p &lt; 0</code> a reta entra e <code>r</code> pode aumentar{' '}
          <code>u1</code>; se <code>p &gt; 0</code> ela sai e <code>r</code> pode diminuir <code>u2</code>; se{' '}
          <code>p = 0</code> e <code>q &lt; 0</code> é paralela e fora. A aba Variáveis mostra a tabela de{' '}
          <code>p_k, q_k, r_k</code>.
        </p>
      }
    />
  );
}
