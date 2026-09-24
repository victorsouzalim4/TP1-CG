/**
 * Módulo "Reta - Bresenham" (slides "CG 05 Bresenham"), versão genérica para todos os octantes.
 */
import { algoritmoBresenhamReta } from '../../core/rasterizacao/bresenhamReta';
import { ModuloRasterReta } from '../comum/ModuloRasterReta';

export function ModuloBresenhamReta() {
  return (
    <ModuloRasterReta
      rasterizador="bresenham"
      algoritmo={algoritmoBresenhamReta}
      sobre={
        <p>
          Usa só aritmética inteira. O parâmetro de decisão <code>p</code> diz se o próximo pixel mantém a coordenada
          secundária (<code>p &lt; 0</code>, soma <code>const1</code>) ou a incrementa (<code>p ≥ 0</code>, soma{' '}
          <code>const2</code>).
        </p>
      }
    />
  );
}
