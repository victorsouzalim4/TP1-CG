/**
 * Grupo de botões mutuamente exclusivos (escolha entre poucas opções, sem teclado).
 * Genérico no tipo do valor (string ou number), para uso com uniões literais.
 */
import './controles.css';

export interface OpcaoSegmentada<T> {
  valor: T;
  rotulo: string;
  titulo?: string;
  desabilitada?: boolean;
}

export interface BotoesSegmentadosProps<T extends string | number> {
  opcoes: readonly OpcaoSegmentada<T>[];
  valor: T;
  onChange(v: T): void;
  compacto?: boolean;
  /** Rótulo acessível do grupo (também usado como `title`). */
  rotulo?: string;
}

export function BotoesSegmentados<T extends string | number>({ opcoes, valor, onChange, compacto = false, rotulo }: BotoesSegmentadosProps<T>) {
  return (
    <div className={'segmentado' + (compacto ? ' segmentado--compacto' : '')} role="group" aria-label={rotulo} title={rotulo}>
      {opcoes.map((o) => {
        const ativa = o.valor === valor;
        return (
          <button
            key={String(o.valor)}
            type="button"
            className={'segmentado__opcao' + (ativa ? ' segmentado__opcao--ativa' : '')}
            aria-pressed={ativa}
            title={o.titulo ?? o.rotulo}
            disabled={o.desabilitada}
            onClick={() => {
              if (!ativa) onChange(o.valor);
            }}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
