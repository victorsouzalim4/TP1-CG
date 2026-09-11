/**
 * Seleção de cor por clique: quadradinhos coloridos com borda na cor selecionada.
 */
import { PALETA, type CorPaleta } from '../../core/cores';
import './controles.css';

export interface PaletaProps {
  /** Padrão: `PALETA` do core. */
  cores?: readonly CorPaleta[];
  /** Hex da cor selecionada. */
  valor: string;
  onChange(hex: string): void;
  rotulo?: string;
  compacta?: boolean;
}

export function Paleta({ cores = PALETA, valor, onChange, rotulo, compacta = false }: PaletaProps) {
  return (
    <div className={'paleta' + (compacta ? ' paleta--compacta' : '')} role="group" aria-label={rotulo ?? 'Cor'}>
      {rotulo && <span className="controle__rotulo">{rotulo}</span>}
      <div className="paleta__cores">
        {cores.map((c) => {
          const ativa = c.hex.toLowerCase() === valor.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              className={'paleta__cor' + (ativa ? ' paleta__cor--ativa' : '')}
              style={{ background: c.hex }}
              title={c.nome}
              aria-label={c.nome}
              aria-pressed={ativa}
              onClick={() => onChange(c.hex)}
            />
          );
        })}
      </div>
    </div>
  );
}
