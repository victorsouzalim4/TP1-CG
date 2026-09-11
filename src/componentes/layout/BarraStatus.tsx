/**
 * Barra de status: coordenadas da célula sob o ponteiro, instrução da ferramenta e aviso.
 * Ex.: "x: 12  y: 7 · Clique no ponto final P2".
 */
import type { Ponto } from '../../core/tipos';
import { formatarNumero } from '../../core/geometria';
import './layout.css';

export interface BarraStatusProps {
  hover: Ponto | null;
  instrucao?: string;
  /** Mensagem de erro/aviso (vermelha, à direita). */
  aviso?: string;
}

export function BarraStatus({ hover, instrucao, aviso }: BarraStatusProps) {
  const coords = hover ? `x: ${formatarNumero(hover.x)}  y: ${formatarNumero(hover.y)}` : 'x: —  y: —';
  return (
    <div className="barra-status" role="status">
      <span className="barra-status__coords">{coords}</span>
      {instrucao && (
        <>
          <span className="barra-status__separador" aria-hidden="true">
            ·
          </span>
          <span className="barra-status__instrucao">{instrucao}</span>
        </>
      )}
      {aviso && (
        <span className="barra-status__aviso" role="alert">
          {aviso}
        </span>
      )}
    </div>
  );
}
