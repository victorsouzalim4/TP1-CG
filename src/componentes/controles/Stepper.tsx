/**
 * Entrada numérica sem teclado: `[−] valor [+]`.
 * Os botões desabilitam nos limites e repetem o passo enquanto pressionados (após 400 ms).
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { formatarNumero } from '../../core/geometria';
import './controles.css';

export interface StepperProps {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  /** Incremento por clique. Padrão: 1. */
  passo?: number;
  onChange(v: number): void;
  formatar?(v: number): string;
  disabled?: boolean;
}

const ATRASO_REPETICAO_MS = 400;
const INTERVALO_REPETICAO_MS = 60;

/** Número de casas decimais de `passo` (para evitar acúmulo de erro em passos fracionários). */
function casasDecimais(passo: number): number {
  const texto = String(passo);
  const i = texto.indexOf('.');
  return i < 0 ? 0 : texto.length - i - 1;
}

export function Stepper({ rotulo, valor, min, max, passo = 1, onChange, formatar = formatarNumero, disabled = false }: StepperProps) {
  const podeDiminuir = !disabled && valor > min;
  const podeAumentar = !disabled && valor < max;

  // A ação lê sempre o valor mais recente (o intervalo de repetição sobrevive a vários renders).
  // Devolve `true` enquanto ainda há espaço para continuar repetindo.
  const aplicarRef = useRef<(direcao: 1 | -1) => boolean>(() => false);
  useLayoutEffect(() => {
    aplicarRef.current = (direcao) => {
      const fator = 10 ** casasDecimais(passo);
      const novo = Math.round((valor + direcao * passo) * fator) / fator;
      const limitado = Math.min(max, Math.max(min, novo));
      if (limitado === valor) return false;
      onChange(limitado);
      return limitado !== min && limitado !== max;
    };
  });

  const temporizadores = useRef<{ atraso: number | null; intervalo: number | null }>({ atraso: null, intervalo: null });

  function parar(): void {
    const t = temporizadores.current;
    if (t.atraso !== null) window.clearTimeout(t.atraso);
    if (t.intervalo !== null) window.clearInterval(t.intervalo);
    t.atraso = null;
    t.intervalo = null;
    window.removeEventListener('pointerup', parar);
  }

  function iniciar(direcao: 1 | -1): void {
    parar();
    if (!aplicarRef.current(direcao)) return; // já chegou ao limite: sem repetição
    // O botão pode ficar desabilitado durante a repetição (e deixar de receber pointerup):
    // por isso a parada também é escutada na janela.
    window.addEventListener('pointerup', parar);
    temporizadores.current.atraso = window.setTimeout(() => {
      temporizadores.current.intervalo = window.setInterval(() => {
        if (!aplicarRef.current(direcao)) parar();
      }, INTERVALO_REPETICAO_MS);
    }, ATRASO_REPETICAO_MS);
  }

  useEffect(() => parar, []);

  return (
    <div className="stepper" role="group" aria-label={rotulo}>
      <span className="stepper__rotulo" title={rotulo}>
        {rotulo}
      </span>
      <span className="stepper__grupo">
        <button
          type="button"
          className="stepper__botao"
          title={`Diminuir ${rotulo}`}
          aria-label={`Diminuir ${rotulo}`}
          disabled={!podeDiminuir}
          onPointerDown={() => iniciar(-1)}
          onPointerUp={parar}
          onPointerLeave={parar}
          onPointerCancel={parar}
        >
          −
        </button>
        <span className="stepper__valor" aria-live="polite">
          {formatar(valor)}
        </span>
        <button
          type="button"
          className="stepper__botao"
          title={`Aumentar ${rotulo}`}
          aria-label={`Aumentar ${rotulo}`}
          disabled={!podeAumentar}
          onPointerDown={() => iniciar(1)}
          onPointerUp={parar}
          onPointerLeave={parar}
          onPointerCancel={parar}
        >
          +
        </button>
      </span>
    </div>
  );
}
