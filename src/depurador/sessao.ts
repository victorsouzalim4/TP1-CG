/**
 * Sessão de depuração: executa um algoritmo INTEIRO de uma vez (eager) e guarda todos os passos,
 * para que a UI possa andar para a frente e para trás em O(1).
 *
 * Estratégia de memória: os pixels de todos os passos ficam num único array plano `todosPixels`;
 * `fimPixels[i]` guarda quantos pixels existem até o passo i (inclusive). Assim o quadro do passo
 * i é `todosPixels.slice(0, fimPixels[i])` e "voltar um passo" não precisa recomputar nada.
 *
 * Puro TypeScript: sem React e sem store, para ser testável com vitest.
 */
import type { Algoritmo, Overlay, Passo, Pixel, Variaveis } from '../core/tipos';

export interface SessaoDepuracao {
  algoritmoId: string;
  nome: string;
  codigo: string;
  passos: Passo[];
  /** Todos os pixels pintados, na ordem, já com cor. */
  todosPixels: Pixel[];
  /** `fimPixels[i]` = total de pixels acumulados até o passo i (inclusive). */
  fimPixels: number[];
  /** Valor de retorno do algoritmo. */
  resultado: unknown;
  /** `true` quando o limite `maxPassos` foi atingido (os passos excedentes viraram um passo sintético). */
  truncado: boolean;
  passosOmitidos: number;
}

export interface OpcoesSessao {
  /** Limite de passos guardados (padrão 50_000); protege a memória em execuções muito longas. */
  maxPassos?: number;
  /** Cor aplicada aos pixels que o algoritmo emite sem cor. */
  corPadrao: string;
}

export const MAX_PASSOS_PADRAO = 50_000;

export function criarSessao<P, R>(alg: Algoritmo<P, R>, params: P, opcoes: OpcoesSessao): SessaoDepuracao {
  const maxPassos = opcoes.maxPassos ?? MAX_PASSOS_PADRAO;
  const passos: Passo[] = [];
  const todosPixels: Pixel[] = [];
  const fimPixels: number[] = [];
  let passosOmitidos = 0;
  let ultimoOmitido: Passo | null = null;

  // Erros lançados pelo generator (ex.: stub "não implementado") propagam para quem chamou.
  const gen = alg.executar(params);
  let r = gen.next();
  while (!r.done) {
    const p = r.value;
    if (p.pixels) {
      for (const px of p.pixels) todosPixels.push({ x: px.x, y: px.y, cor: px.cor ?? opcoes.corPadrao });
    }
    if (passos.length < maxPassos) {
      passos.push(p);
      fimPixels.push(todosPixels.length);
    } else {
      // Acima do limite continua-se consumindo só para coletar os pixels do resultado final.
      passosOmitidos += 1;
      ultimoOmitido = p;
    }
    r = gen.next();
  }

  if (ultimoOmitido !== null) {
    // Passo sintético final: mostra o estado do último passo real com TODOS os pixels pintados.
    passos.push({
      linha: ultimoOmitido.linha,
      variaveis: ultimoOmitido.variaveis,
      descricao: `Limite de ${maxPassos} passos atingido: ${passosOmitidos} passos omitidos; resultado final`,
    });
    fimPixels.push(todosPixels.length);
  }

  return {
    algoritmoId: alg.id,
    nome: alg.nome,
    codigo: alg.codigo,
    passos,
    todosPixels,
    fimPixels,
    resultado: r.value,
    truncado: passosOmitidos > 0,
    passosOmitidos,
  };
}

/** Tudo o que a UI precisa para desenhar um instante da execução. */
export interface Quadro {
  /** Índice do passo; -1 = antes de iniciar (nada pintado). */
  indice: number;
  total: number;
  linha: number | null;
  variaveis: Variaveis;
  /** Variáveis cujo valor mudou em relação ao passo anterior (todas, no primeiro passo). */
  variaveisAlteradas: Set<string>;
  /** Pixels acumulados até este passo. */
  pixels: Pixel[];
  overlays: Overlay[];
  descricao?: string;
  /** `true` no último passo da sessão. */
  concluido: boolean;
}

const SEM_OVERLAYS: Overlay[] = [];

export function montarQuadro(sessao: SessaoDepuracao, indice: number): Quadro {
  const total = sessao.passos.length;

  if (indice < 0 || total === 0) {
    return {
      indice: -1,
      total,
      linha: null,
      variaveis: {},
      variaveisAlteradas: new Set(),
      pixels: [],
      overlays: SEM_OVERLAYS,
      concluido: total === 0,
    };
  }

  const i = Math.min(indice, total - 1);
  const atual = sessao.passos[i];
  const anterior: Variaveis = i > 0 ? sessao.passos[i - 1].variaveis : {};

  // Comparação estrutural por chave (os valores são JSON puro por contrato).
  const variaveisAlteradas = new Set<string>();
  for (const chave of Object.keys(atual.variaveis)) {
    if (!(chave in anterior) || JSON.stringify(anterior[chave]) !== JSON.stringify(atual.variaveis[chave])) {
      variaveisAlteradas.add(chave);
    }
  }

  const quadro: Quadro = {
    indice: i,
    total,
    linha: atual.linha,
    variaveis: atual.variaveis,
    variaveisAlteradas,
    pixels: sessao.todosPixels.slice(0, sessao.fimPixels[i]),
    overlays: atual.overlays ?? SEM_OVERLAYS,
    concluido: i === total - 1,
  };
  if (atual.descricao !== undefined) quadro.descricao = atual.descricao;
  return quadro;
}
