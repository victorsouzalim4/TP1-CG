/**
 * Módulo "Reta - DDA" (slides "CG 04 DDA").
 */
import { algoritmoDDA } from '../../core/rasterizacao/dda';
import { ModuloRasterReta } from '../comum/ModuloRasterReta';

export function ModuloDDA() {
  return (
    <ModuloRasterReta
      rasterizador="dda"
      algoritmo={algoritmoDDA}
      sobre={
        <p>
          O eixo de maior variação define o número de <strong>passos</strong>. A cada iteração, x e y recebem incrementos
          reais (<code>x_incr</code>, <code>y_incr</code>) e o ponto é arredondado para escolher o pixel.
        </p>
      }
    />
  );
}
