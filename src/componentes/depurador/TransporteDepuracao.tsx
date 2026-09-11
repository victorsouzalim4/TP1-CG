/**
 * Controles de execução passo a passo: ⏮ ◀ ▶/⏸ ▶| ⏭, contador "Passo i / n" e velocidade.
 *
 * Regras de habilitação: tudo desabilitado quando `!ativo`; "reiniciar" e "retroceder" também
 * quando `indice < 0` (ainda antes do primeiro passo). "Avançar"/"ir ao fim" ficam a cargo do
 * depurador (o total pode crescer enquanto o gerador produz passos).
 */
import { IconeAvancar, IconeExecutar, IconeIrAoFim, IconePausar, IconeReiniciar, IconeRetroceder } from '../icones';
import './depurador.css';
import '../controles/controles.css';

export interface TransporteDepuracaoProps {
  /** Índice do passo atual (−1 antes do primeiro). */
  indice: number;
  /** Número de passos conhecidos. */
  total: number;
  executando: boolean;
  /** Passos por segundo (1..30). */
  velocidade: number;
  /** `false` quando não há algoritmo carregado: todos os controles desabilitam. */
  ativo: boolean;
  onReiniciar(): void;
  onRetroceder(): void;
  onAlternarExecucao(): void;
  onAvancar(): void;
  onIrAoFim(): void;
  onVelocidade(v: number): void;
}

export const VELOCIDADE_MIN = 1;
export const VELOCIDADE_MAX = 30;

export function TransporteDepuracao({
  indice,
  total,
  executando,
  velocidade,
  ativo,
  onReiniciar,
  onRetroceder,
  onAlternarExecucao,
  onAvancar,
  onIrAoFim,
  onVelocidade,
}: TransporteDepuracaoProps) {
  const antesDoInicio = indice < 0;
  const textoPasso = `Passo ${antesDoInicio ? '—' : indice + 1} / ${total}`;

  return (
    <div className={'transporte' + (ativo ? '' : ' transporte--inativo')} role="group" aria-label="Controles de execução">
      <div className="transporte__botoes">
        <button type="button" className="transporte__botao" title="Reiniciar (voltar ao início)" disabled={!ativo || antesDoInicio} onClick={onReiniciar}>
          <IconeReiniciar />
        </button>
        <button type="button" className="transporte__botao" title="Retroceder um passo" disabled={!ativo || antesDoInicio} onClick={onRetroceder}>
          <IconeRetroceder />
        </button>
        <button
          type="button"
          className="transporte__botao transporte__botao--principal"
          title={executando ? 'Pausar' : 'Executar automaticamente'}
          aria-pressed={executando}
          disabled={!ativo}
          onClick={onAlternarExecucao}
        >
          {executando ? <IconePausar /> : <IconeExecutar />}
        </button>
        <button type="button" className="transporte__botao" title="Avançar um passo" disabled={!ativo} onClick={onAvancar}>
          <IconeAvancar />
        </button>
        <button type="button" className="transporte__botao" title="Ir ao fim" disabled={!ativo} onClick={onIrAoFim}>
          <IconeIrAoFim />
        </button>
      </div>

      <span className="transporte__passo" aria-live="polite">
        {textoPasso}
      </span>

      <div className="transporte__velocidade">
        <span className="transporte__velocidade-rotulo">Velocidade</span>
        <input
          type="range"
          className="slider__faixa"
          min={VELOCIDADE_MIN}
          max={VELOCIDADE_MAX}
          step={1}
          value={velocidade}
          disabled={!ativo}
          aria-label="Velocidade de execução (passos por segundo)"
          title={`${velocidade} passos por segundo`}
          onChange={(e) => onVelocidade(Number(e.currentTarget.value))}
        />
        <span className="transporte__velocidade-valor">{velocidade} passos/s</span>
      </div>
    </div>
  );
}
