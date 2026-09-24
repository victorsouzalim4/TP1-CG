/**
 * Inicia a depuração de um algoritmo a partir de um módulo: executa o generator inteiro
 * (`criarSessao`), entrega a sessão ao store e, por padrão, já liga a reprodução automática.
 */
import type { Algoritmo } from '../../core/tipos';
import { criarSessao } from '../../depurador/sessao';
import { useStore } from '../../estado/store';

export interface OpcoesExecucao {
  /** Cor dos pixels que o algoritmo emite sem cor. */
  cor: string;
  /** Objetos da cena ocultados enquanto a sessão os redesenha passo a passo. */
  ocultos?: string[];
  /** Liga o "play" logo após criar a sessão. Padrão: `true`. */
  reproduzir?: boolean;
}

/** Devolve `null` em caso de sucesso ou a mensagem de erro (para a barra de status). */
export function executarAlgoritmo<P, R>(alg: Algoritmo<P, R>, params: P, opcoes: OpcoesExecucao): string | null {
  let sessao;
  try {
    sessao = criarSessao(alg, params, { corPadrao: opcoes.cor });
  } catch (e) {
    return `Erro ao executar ${alg.nome}: ${e instanceof Error ? e.message : String(e)}`;
  }
  const estado = useStore.getState();
  estado.iniciarDepuracao(sessao, opcoes.ocultos ?? []);
  if (opcoes.reproduzir ?? true) estado.alternarExecucao();
  return null;
}
