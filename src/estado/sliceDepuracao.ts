/**
 * Slice "depuracao": sessão ativa, passo atual e controle de reprodução.
 *
 * A sessão é imutável (todos os passos já calculados por `criarSessao`); o store guarda apenas
 * o índice do passo exibido. `objetosOcultos` lista os ids dos objetos da cena que não devem ser
 * desenhados enquanto a sessão está ativa (ex.: o objeto que está sendo transformado).
 */
import type { StateCreator } from 'zustand';
import type { SessaoDepuracao } from '../depurador/sessao';
import type { Estado } from './store';

export interface EstadoDepuracao {
  sessao: SessaoDepuracao | null;
  /** Índice do passo exibido; -1 = antes de iniciar. */
  indice: number;
  /** Reprodução automática ligada (ver `usePlayer`). */
  executando: boolean;
  /** Passos por segundo (1..30). */
  velocidade: number;
  objetosOcultos: string[];
}

export interface SliceDepuracao {
  depuracao: EstadoDepuracao;
  iniciarDepuracao(sessao: SessaoDepuracao, objetosOcultos?: string[]): void;
  /** Vai para o passo `i` (limitado a [-1, total - 1]). */
  irPara(i: number): void;
  /** Avança um passo; devolve `false` se já estava no fim. Ao chegar ao fim desliga `executando`. */
  avancar(): boolean;
  retroceder(): void;
  reiniciar(): void;
  irAoFim(): void;
  /** Liga/desliga a reprodução; se a sessão já terminou, reinicia e liga. */
  alternarExecucao(): void;
  definirVelocidade(v: number): void;
  encerrarDepuracao(): void;
}

export const VELOCIDADE_MIN = 1;
export const VELOCIDADE_MAX = 30;

export const DEPURACAO_INICIAL: EstadoDepuracao = {
  sessao: null,
  indice: -1,
  executando: false,
  velocidade: 4,
  objetosOcultos: [],
};

function ultimoIndice(sessao: SessaoDepuracao | null): number {
  return sessao ? sessao.passos.length - 1 : -1;
}

export const criarSliceDepuracao: StateCreator<Estado, [], [], SliceDepuracao> = (set, get) => ({
  depuracao: DEPURACAO_INICIAL,

  iniciarDepuracao(sessao, objetosOcultos = []) {
    set((s) => ({
      depuracao: { ...s.depuracao, sessao, indice: -1, executando: false, objetosOcultos: [...objetosOcultos] },
    }));
  },

  irPara(i) {
    set((s) => {
      if (!s.depuracao.sessao) return s;
      const fim = ultimoIndice(s.depuracao.sessao);
      const indice = Math.max(-1, Math.min(fim, Math.trunc(i)));
      return { depuracao: { ...s.depuracao, indice, executando: s.depuracao.executando && indice < fim } };
    });
  },

  avancar() {
    const { sessao, indice } = get().depuracao;
    const fim = ultimoIndice(sessao);
    if (!sessao || indice >= fim) {
      set((s) => (s.depuracao.executando ? { depuracao: { ...s.depuracao, executando: false } } : s));
      return false;
    }
    const proximo = indice + 1;
    set((s) => ({
      depuracao: { ...s.depuracao, indice: proximo, executando: s.depuracao.executando && proximo < fim },
    }));
    return true;
  },

  retroceder() {
    set((s) => {
      if (!s.depuracao.sessao) return s;
      return { depuracao: { ...s.depuracao, indice: Math.max(-1, s.depuracao.indice - 1) } };
    });
  },

  reiniciar() {
    set((s) => (s.depuracao.sessao ? { depuracao: { ...s.depuracao, indice: -1, executando: false } } : s));
  },

  irAoFim() {
    set((s) => {
      if (!s.depuracao.sessao) return s;
      return { depuracao: { ...s.depuracao, indice: ultimoIndice(s.depuracao.sessao), executando: false } };
    });
  },

  alternarExecucao() {
    set((s) => {
      const { sessao, indice, executando } = s.depuracao;
      if (!sessao) return s;
      // "Play" com a sessão concluída recomeça do início, como num player de vídeo.
      if (!executando && indice >= ultimoIndice(sessao)) {
        return { depuracao: { ...s.depuracao, indice: -1, executando: true } };
      }
      return { depuracao: { ...s.depuracao, executando: !executando } };
    });
  },

  definirVelocidade(v) {
    const velocidade = Math.min(VELOCIDADE_MAX, Math.max(VELOCIDADE_MIN, Number.isFinite(v) ? v : DEPURACAO_INICIAL.velocidade));
    set((s) => ({ depuracao: { ...s.depuracao, velocidade } }));
  },

  encerrarDepuracao() {
    set((s) => {
      if (!s.depuracao.sessao && s.depuracao.objetosOcultos.length === 0 && !s.depuracao.executando) return s;
      return { depuracao: { ...s.depuracao, sessao: null, indice: -1, executando: false, objetosOcultos: [] } };
    });
  },
});
