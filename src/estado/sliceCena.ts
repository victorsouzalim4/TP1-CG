/**
 * Slice "cena": objetos gráficos, seleção por região, janela de recorte e histórico (desfazer).
 *
 * Toda mutação da GEOMETRIA dos objetos (adicionar, remover, substituir, limpar) empilha um
 * snapshot em `historico`. Mudanças de seleção não empilham: são estado de visualização, e
 * empilhá-las tornaria o "desfazer" inútil (cada clique de seleção viraria um passo).
 */
import type { StateCreator } from 'zustand';
import type { Retangulo } from '../core/tipos';
import { gerarId } from '../core/geometria';
import { ROTULO_TIPO, type ObjetoGrafico } from '../core/cena/objetos';
import { aplicarSelecao, objetosNaRegiao } from '../core/cena/selecao';
import type { Estado } from './store';

export interface EstadoCena {
  objetos: ObjetoGrafico[];
  /** Retângulo de seleção (provisório durante o arrasto; o último usado depois dele). */
  regiaoSelecao: Retangulo | null;
  janelaRecorte: Retangulo | null;
  /** Snapshots anteriores de `objetos`, do mais antigo ao mais recente (máximo `HISTORICO_MAX`). */
  historico: ObjetoGrafico[][];
}

export interface SliceCena {
  cena: EstadoCena;
  /** Adiciona o objeto (gera "Reta 1", "Polígono 2"... se `nome` estiver vazio) e devolve o id. */
  adicionarObjeto(obj: ObjetoGrafico): string;
  removerObjeto(id: string): void;
  /** Troca, pelo id, os objetos existentes pelas versões recebidas; ids desconhecidos são ignorados. */
  substituirObjetos(objs: ObjetoGrafico[]): void;
  /** Seleciona os objetos totalmente contidos em `r` e guarda `r` como `regiaoSelecao`. */
  selecionarPorRegiao(r: Retangulo): void;
  alternarSelecao(id: string): void;
  limparSelecao(): void;
  /** Retângulo provisório mostrado durante o arrasto do mouse. */
  definirRegiaoSelecao(r: Retangulo | null): void;
  definirJanelaRecorte(r: Retangulo | null): void;
  /** Remove objetos, seleção e janela; encerra a depuração. */
  limparCena(): void;
  desfazer(): void;
}

export const HISTORICO_MAX = 50;

export const CENA_INICIAL: EstadoCena = {
  objetos: [],
  regiaoSelecao: null,
  janelaRecorte: null,
  historico: [],
};

/** Empilha um snapshot, descartando o mais antigo quando o limite é atingido. */
function empilhar(historico: ObjetoGrafico[][], objetos: ObjetoGrafico[]): ObjetoGrafico[][] {
  const novo = [...historico, objetos];
  return novo.length > HISTORICO_MAX ? novo.slice(novo.length - HISTORICO_MAX) : novo;
}

/** Menor N tal que "<Rótulo> N" ainda não é usado por nenhum objeto. */
export function gerarNome(objetos: readonly ObjetoGrafico[], tipo: ObjetoGrafico['tipo']): string {
  const usados = new Set(objetos.map((o) => o.nome));
  const rotulo = ROTULO_TIPO[tipo];
  let n = 1;
  while (usados.has(`${rotulo} ${n}`)) n += 1;
  return `${rotulo} ${n}`;
}

export const criarSliceCena: StateCreator<Estado, [], [], SliceCena> = (set, get) => ({
  cena: CENA_INICIAL,

  adicionarObjeto(obj) {
    const { objetos } = get().cena;
    const id = obj.id || gerarId(obj.tipo);
    const nome = obj.nome.trim() === '' ? gerarNome(objetos, obj.tipo) : obj.nome;
    const novo: ObjetoGrafico = { ...obj, id, nome };
    set((s) => ({
      cena: { ...s.cena, objetos: [...s.cena.objetos, novo], historico: empilhar(s.cena.historico, s.cena.objetos) },
    }));
    return id;
  },

  removerObjeto(id) {
    set((s) => {
      if (!s.cena.objetos.some((o) => o.id === id)) return s;
      return {
        cena: {
          ...s.cena,
          objetos: s.cena.objetos.filter((o) => o.id !== id),
          historico: empilhar(s.cena.historico, s.cena.objetos),
        },
      };
    });
  },

  substituirObjetos(objs) {
    const porId = new Map(objs.map((o) => [o.id, o]));
    set((s) => ({
      cena: {
        ...s.cena,
        objetos: s.cena.objetos.map((o) => porId.get(o.id) ?? o),
        historico: empilhar(s.cena.historico, s.cena.objetos),
      },
    }));
  },

  selecionarPorRegiao(r) {
    set((s) => ({
      cena: {
        ...s.cena,
        regiaoSelecao: r,
        objetos: aplicarSelecao(s.cena.objetos, objetosNaRegiao(s.cena.objetos, r)),
      },
    }));
  },

  alternarSelecao(id) {
    set((s) => ({
      cena: {
        ...s.cena,
        objetos: s.cena.objetos.map((o) => (o.id === id ? { ...o, selecionado: !o.selecionado } : o)),
      },
    }));
  },

  limparSelecao() {
    set((s) => {
      if (!s.cena.objetos.some((o) => o.selecionado) && s.cena.regiaoSelecao === null) return s;
      return { cena: { ...s.cena, regiaoSelecao: null, objetos: aplicarSelecao(s.cena.objetos, []) } };
    });
  },

  definirRegiaoSelecao(r) {
    set((s) => ({ cena: { ...s.cena, regiaoSelecao: r } }));
  },

  definirJanelaRecorte(r) {
    set((s) => ({ cena: { ...s.cena, janelaRecorte: r } }));
  },

  limparCena() {
    get().encerrarDepuracao();
    set((s) => ({
      cena: {
        objetos: [],
        regiaoSelecao: null,
        janelaRecorte: null,
        historico: s.cena.objetos.length > 0 ? empilhar(s.cena.historico, s.cena.objetos) : s.cena.historico,
      },
    }));
  },

  desfazer() {
    const { historico } = get().cena;
    if (historico.length === 0) return;
    // Uma sessão em andamento pode referir-se a objetos que deixarão de existir: encerra por segurança.
    get().encerrarDepuracao();
    set((s) => ({
      cena: {
        ...s.cena,
        objetos: s.cena.historico[s.cena.historico.length - 1],
        historico: s.cena.historico.slice(0, -1),
      },
    }));
  },
});
