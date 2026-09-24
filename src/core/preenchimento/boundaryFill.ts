/**
 * Boundary Fill (preenchimento até a cor de fronteira) — slides "CG 08 Preenchimento".
 *
 * A partir da semente, pinta com `cor_preenche` toda célula alcançável cuja cor não seja a do
 * contorno (nem a do próprio preenchimento, o que evita repintar). A conectividade define quais
 * vizinhos são visitados: 4 (direita, esquerda, cima, baixo) ou 8 (mais as diagonais). Com 8, o
 * preenchimento "escapa" por contornos que só se tocam pelos cantos (slide 12).
 *
 * Versão iterativa com pilha explícita, equivalente à recursiva dos slides (ver `comum.ts`).
 * Há uma listagem por conectividade: a de 8 acrescenta as 4 diagonais.
 */
import type { Algoritmo, Passo } from '../tipos';
import { COR_PADRAO } from '../cores';
import { cor, lacoPreenchimento, linhasEmpilha, type ParametrosPreenchimento, type ResultadoPreenchimento } from './comum';

function listagem(conectividade: 4 | 8): string {
  const nome = `boundary${conectividade}`;
  return [
    `procedimento ${nome}(x, y, cor_preenche, cor_contorno)`,
    '  // versão iterativa equivalente à recursiva dos slides',
    '  pilha = vazia;  empilha(x, y)',
    '  enquanto pilha não vazia faça',
    '    (x, y) = desempilha();  cor_atual = inquirir_cor(x, y)',
    '    se (cor_atual <> cor_contorno) e (cor_atual <> cor_preenche) então',
    '      set_pixel(x, y, cor_preenche)',
    `      {conectividade ${conectividade}}`,
    ...linhasEmpilha(conectividade, '      '),
    '    fim-se',
    '  fim-enquanto',
    `fim {procedimento ${nome}}`,
  ].join('\n');
}

/** Listagem da conectividade 4 (13 linhas). */
export const CODIGO_BOUNDARY_FILL = listagem(4);
/** Listagem da conectividade 8 (15 linhas: + 2 linhas com as diagonais). */
export const CODIGO_BOUNDARY_FILL_8 = listagem(8);

/**
 * Cria o algoritmo cuja listagem corresponde à conectividade `listagemDe`. O comportamento segue
 * `params.conectividade`; use `algoritmoBoundaryFillPara` para que listagem e execução coincidam.
 */
function criarBoundaryFill(listagemDe: 4 | 8): Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> {
  return {
    id: 'boundary-fill',
    nome: listagemDe === 4 ? 'Boundary Fill (conectividade 4)' : 'Boundary Fill (conectividade 8)',
    codigo: listagem(listagemDe),
    *executar(params: ParametrosPreenchimento): Generator<Passo, ResultadoPreenchimento, void> {
      const corContorno = params.corContorno ?? COR_PADRAO;
      const corPreenche = params.corPreenche;
      return yield* lacoPreenchimento(params, {
        linhas: {
          empilhaSemente: 3,
          desempilha: 5,
          decisao: 6,
          setPixel: 7,
          ultimoEmpilha: listagemDe === 4 ? 10 : 12,
        },
        fixas: { cor_contorno: cor(corContorno) },
        testar(corAtual) {
          if (corAtual === corContorno) return `cor_atual = cor_contorno (${cor(corContorno)})`;
          if (corAtual === corPreenche) return `cor_atual = cor_preenche (${cor(corPreenche)}): já pintada`;
          return null;
        },
        motivoPinta(corAtual) {
          return `cor_atual (${cor(corAtual)}) ≠ cor_contorno e ≠ cor_preenche`;
        },
      });
    },
  };
}

/** Boundary Fill com a listagem da conectividade 4 (o registrado em `core/registro.ts`). */
export const algoritmoBoundaryFill = criarBoundaryFill(4);
/** Boundary Fill com a listagem da conectividade 8. */
export const algoritmoBoundaryFill8 = criarBoundaryFill(8);

/** Algoritmo cuja listagem corresponde à conectividade escolhida. */
export function algoritmoBoundaryFillPara(
  conectividade: 4 | 8,
): Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> {
  return conectividade === 4 ? algoritmoBoundaryFill : algoritmoBoundaryFill8;
}
