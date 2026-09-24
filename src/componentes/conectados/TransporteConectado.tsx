/**
 * `TransporteDepuracao` ligado ao slice de depuração do store.
 */
import { useStore } from '../../estado/store';
import { TransporteDepuracao } from '../depurador/TransporteDepuracao';

export function TransporteConectado() {
  const { sessao, indice, executando, velocidade } = useStore((s) => s.depuracao);
  const reiniciar = useStore((s) => s.reiniciar);
  const retroceder = useStore((s) => s.retroceder);
  const alternarExecucao = useStore((s) => s.alternarExecucao);
  const avancar = useStore((s) => s.avancar);
  const irAoFim = useStore((s) => s.irAoFim);
  const definirVelocidade = useStore((s) => s.definirVelocidade);

  return (
    <TransporteDepuracao
      indice={indice}
      total={sessao?.passos.length ?? 0}
      executando={executando}
      velocidade={velocidade}
      ativo={sessao !== null}
      onReiniciar={reiniciar}
      onRetroceder={retroceder}
      onAlternarExecucao={alternarExecucao}
      onAvancar={() => void avancar()}
      onIrAoFim={irAoFim}
      onVelocidade={definirVelocidade}
    />
  );
}
