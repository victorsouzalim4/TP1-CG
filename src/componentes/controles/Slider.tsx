/**
 * Entrada numérica por arrasto (`<input type="range">`), com valor formatado e presets clicáveis.
 */
import { formatarNumero } from '../../core/geometria';
import './controles.css';

export interface PresetSlider {
  rotulo: string;
  valor: number;
}

export interface SliderProps {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  onChange(v: number): void;
  formatar?(v: number): string;
  presets?: readonly PresetSlider[];
  disabled?: boolean;
}

export function Slider({ rotulo, valor, min, max, passo = 1, onChange, formatar = formatarNumero, presets, disabled = false }: SliderProps) {
  return (
    <div className="controle slider">
      <div className="controle__cabecalho">
        <span className="controle__rotulo">{rotulo}</span>
        <span className="controle__valor">{formatar(valor)}</span>
      </div>
      <input
        type="range"
        className="slider__faixa"
        min={min}
        max={max}
        step={passo}
        value={valor}
        disabled={disabled}
        aria-label={rotulo}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      {presets && presets.length > 0 && (
        <div className="slider__presets">
          {presets.map((p) => (
            <button
              key={`${p.rotulo}-${p.valor}`}
              type="button"
              className={'slider__preset' + (p.valor === valor ? ' slider__preset--ativo' : '')}
              disabled={disabled}
              title={`${rotulo} = ${formatar(p.valor)}`}
              onClick={() => onChange(p.valor)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
