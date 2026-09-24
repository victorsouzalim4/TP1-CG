/**
 * Tipos e utilitários compartilhados pelos algoritmos de preenchimento (Boundary Fill e
 * Flood Fill) — slides "CG 08 Preenchimento".
 *
 * Os slides apresentam as duas versões de forma RECURSIVA. Aqui elas são iterativas, com uma
 * pilha explícita (a recursão de uma área grande estouraria a pilha de chamadas do JavaScript, e
 * a pilha visível no painel "Variáveis" ajuda a entender a ordem de visita). Empilhando os
 * vizinhos na ordem INVERSA da chamada recursiva, o vizinho (x+1, y) fica no topo e sai primeiro:
 * a sequência de testes e pinturas é exatamente a mesma da versão recursiva.
 */
import { passo, type Overlay, type Passo, type Pixel, type Ponto, type Valor, type Variaveis } from '../tipos';
import { COR_OVERLAY, nomeDaCor } from '../cores';
import type { MatrizPixels } from '../matrizPixels';

export interface ParametrosPreenchimento {
  /** Semente (ponto inicial do preenchimento). */
  x: number;
  y: number;
  /** Cor com que se pinta. */
  corPreenche: string;
  /** Cor da fronteira (só o Boundary Fill usa). */
  corContorno?: string;
  /**
   * Cor do interior a recolorir (só o Flood Fill usa). Se omitida, é lida na semente
   * (`inquirir_cor(x, y)` antes de começar).
   */
  corAntiga?: string;
  /** Vizinhança usada na expansão. */
  conectividade: 4 | 8;
  /** Matriz de pixels da cena (o algoritmo trabalha sobre uma cópia). */
  matriz: MatrizPixels;
}

export interface ResultadoPreenchimento {
  pixels: Pixel[];
  /** Quantidade de pixels pintados. */
  total: number;
}

/**
 * Vizinhos de (x, y) na ordem em que os slides os visitam: direita, esquerda, cima, baixo e,
 * na conectividade 8, as quatro diagonais (NE, NO, SE, SO).
 */
export function vizinhos(x: number, y: number, conectividade: 4 | 8): Ponto[] {
  const lista: Ponto[] = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
  if (conectividade === 8) {
    lista.push({ x: x + 1, y: y + 1 }, { x: x - 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y - 1 });
  }
  return lista;
}

/**
 * Snapshot da pilha para o painel de variáveis: só os `topoN` elementos do topo são enviados
 * (a pilha pode ter milhares de itens), com `topo[0]` sendo o topo da pilha.
 * `pilha` segue a convenção de array JS: o último elemento é o topo.
 */
export function snapshotPilha(pilha: readonly Ponto[], topoN = 8): Valor {
  const topo: Valor[] = [];
  for (let i = pilha.length - 1; i >= 0 && topo.length < topoN; i--) {
    topo.push({ tipo: 'ponto', x: pilha[i].x, y: pilha[i].y });
  }
  return { tipo: 'pilha', topo, tamanho: pilha.length };
}

/** Quantas células do topo da pilha são tingidas na grade a cada passo. */
export const PILHA_VISIVEL = 50;

/**
 * Linhas de `empilha` da listagem, na ordem em que aparecem (inversa da chamada recursiva, para
 * que o primeiro vizinho dos slides fique no topo). Na conectividade 8 as quatro diagonais vêm
 * antes, deixando os vizinhos diretos por cima delas.
 */
export function linhasEmpilha(conectividade: 4 | 8, indent: string): string[] {
  const diretos = [
    `${indent}empilha(x, y-1);  empilha(x, y+1)`,
    `${indent}empilha(x-1, y);  empilha(x+1, y)   // (x+1, y) no topo`,
  ];
  if (conectividade === 4) return diretos;
  return [
    `${indent}empilha(x-1, y-1);  empilha(x+1, y-1)   // diagonais`,
    `${indent}empilha(x-1, y+1);  empilha(x+1, y+1)`,
    ...diretos,
  ];
}

/** Números (1-based) das linhas da listagem destacadas pelos passos. */
export interface LinhasListagem {
  /** `pilha = vazia;  empilha(x, y)` da semente. */
  empilhaSemente: number;
  /** `(x, y) = desempilha();  cor_atual = inquirir_cor(x, y)`. */
  desempilha: number;
  /** `se ... então`. */
  decisao: number;
  /** `set_pixel(x, y, cor_preenche)`. */
  setPixel: number;
  /** Última linha de `empilha` (passo "após empilhar os vizinhos"). */
  ultimoEmpilha: number;
}

/** O que diferencia o Boundary Fill do Flood Fill dentro do laço comum. */
export interface ConfigLaco {
  linhas: LinhasListagem;
  /** Variáveis fixas exibidas logo depois de `cor_preenche` (`cor_contorno` ou `cor_antiga`). */
  fixas: Variaveis;
  /** Teste da linha `se`: `null` quando deve pintar; senão, a frase explicando por que não pinta. */
  testar(corAtual: string): string | null;
  /** Frase do caso em que pinta (ex.: "cor_atual ≠ cor_contorno e ≠ cor_preenche"). */
  motivoPinta(corAtual: string): string;
}

/** Nome legível de uma cor (paleta, "Fundo" ou o próprio hex) para variáveis e descrições. */
export function cor(hex: string): string {
  return nomeDaCor(hex);
}

/**
 * Laço comum da versão iterativa: pilha explícita e 3 passos por célula desempilhada
 * (desempilha / decisão com set_pixel / após empilhar) — 2 quando a célula não é pintada.
 *
 * Só se empilham células DENTRO da grade (fora dela `inquirir_cor` devolveria `COR_FORA`): a
 * borda da grade funciona como contorno e a pilha exibida só tem células visíveis.
 */
export function* lacoPreenchimento(
  params: ParametrosPreenchimento,
  config: ConfigLaco,
): Generator<Passo, ResultadoPreenchimento, void> {
  const { corPreenche, conectividade } = params;
  const matriz = params.matriz.clonar();
  const { linhas } = config;
  const pixels: Pixel[] = [];

  // Pilha e, em paralelo, o overlay de cada célula empilhada (criado uma única vez, para que os
  // passos compartilhem as referências em vez de recriar 50 objetos a cada passo).
  const pilha: Ponto[] = [];
  const pilhaOverlays: Overlay[] = [];
  const empilhar = (p: Ponto): void => {
    pilha.push(p);
    pilhaOverlays.push({ tipo: 'celula', x: p.x, y: p.y, cor: COR_OVERLAY.pilha, estilo: 'preenchido' });
  };
  const desempilhar = (): Ponto => {
    pilhaOverlays.pop();
    return pilha.pop() as Ponto;
  };

  let x = params.x;
  let y = params.y;
  let corAtual: string | null = null;
  // O snapshot da pilha só muda ao desempilhar/empilhar: é reaproveitado entre os passos.
  let valorPilha = snapshotPilha(pilha);
  const snap = (): Variaveis => ({
    x,
    y,
    cor_atual: corAtual === null ? null : cor(corAtual),
    cor_preenche: cor(corPreenche),
    ...config.fixas,
    pilha: valorPilha,
    pintados: pixels.length,
  });
  const overlays = (): Overlay[] => {
    const lista = pilhaOverlays.slice(-PILHA_VISIVEL);
    lista.push({ tipo: 'celula', x, y, cor: COR_OVERLAY.destaque, estilo: 'contorno' });
    return lista;
  };

  // Semente
  if (matriz.dentro(x, y)) {
    empilhar({ x, y });
    valorPilha = snapshotPilha(pilha);
    yield passo(linhas.empilhaSemente, snap(), {
      overlays: overlays(),
      descricao: `Empilha a semente (${x}, ${y})`,
    });
  } else {
    yield passo(linhas.empilhaSemente, snap(), {
      descricao: `A semente (${x}, ${y}) está fora da grade: nada a empilhar`,
    });
  }

  while (pilha.length > 0) {
    // Passo 1: desempilha o topo e consulta a cor dele
    const p = desempilhar();
    x = p.x;
    y = p.y;
    corAtual = matriz.inquirirCor(x, y);
    valorPilha = snapshotPilha(pilha);
    yield passo(linhas.desempilha, snap(), {
      overlays: overlays(),
      descricao: `Desempilha (${x}, ${y}); inquirir_cor(${x}, ${y}) = ${cor(corAtual)}`,
    });

    // Passo 2: decisão da linha "se" (e set_pixel quando a condição é verdadeira)
    const motivo = config.testar(corAtual);
    if (motivo !== null) {
      yield passo(linhas.decisao, snap(), {
        overlays: overlays(),
        descricao: `${motivo}: não pinta (${x}, ${y})`,
      });
      continue;
    }
    const px: Pixel = { x, y, cor: corPreenche };
    matriz.setPixel(x, y, corPreenche);
    pixels.push(px);
    yield passo(linhas.setPixel, snap(), {
      pixels: [px],
      overlays: overlays(),
      descricao: `${config.motivoPinta(corAtual)}: set_pixel(${x}, ${y}, ${cor(corPreenche)})`,
    });

    // Passo 3: empilha os vizinhos (ordem inversa: o primeiro vizinho dos slides fica no topo)
    const viz = vizinhos(x, y, conectividade).filter((v) => matriz.dentro(v.x, v.y));
    for (let i = viz.length - 1; i >= 0; i--) empilhar(viz[i]);
    valorPilha = snapshotPilha(pilha);
    const plural = viz.length === 1 ? '' : 's';
    yield passo(linhas.ultimoEmpilha, snap(), {
      overlays: overlays(),
      descricao: `Empilha ${viz.length} vizinho${plural} de (${x}, ${y}) (conectividade ${conectividade}); pilha com ${pilha.length}`,
    });
  }

  return { pixels, total: pixels.length };
}
