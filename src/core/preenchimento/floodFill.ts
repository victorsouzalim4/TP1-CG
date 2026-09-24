/**
 * Flood Fill (substituição da cor interior) — slides "CG 08 Preenchimento".
 *
 * Em vez de parar numa cor de contorno, recolore a região conexa que tem a cor do interior
 * (`cor_antiga`, lida na semente): qualquer outra cor funciona como fronteira. Se `cor_antiga`
 * já for igual a `cor_preenche` não há o que recolorir (e, sem essa guarda, as células pintadas
 * continuariam com a cor procurada e seriam visitadas de novo sem fim).
 *
 * Versão iterativa com pilha explícita, equivalente à recursiva dos slides (ver `comum.ts`).
 * Há uma listagem por conectividade: a de 8 acrescenta as 4 diagonais.
 */
import { passo, type Algoritmo, type Passo } from '../tipos';
import { cor, lacoPreenchimento, linhasEmpilha, snapshotPilha, type ParametrosPreenchimento, type ResultadoPreenchimento } from './comum';

function listagem(conectividade: 4 | 8): string {
  const nome = `flood${conectividade}`;
  return [
    `procedimento ${nome}(x, y, cor_preenche, cor_antiga)`,
    '  // versão iterativa equivalente à recursiva dos slides',
    '  se cor_antiga = cor_preenche então retorna     // nada a recolorir',
    '  pilha = vazia;  empilha(x, y)',
    '  enquanto pilha não vazia faça',
    '    (x, y) = desempilha();  cor_atual = inquirir_cor(x, y)',
    '    se cor_atual = cor_antiga então',
    '      set_pixel(x, y, cor_preenche)',
    `      {conectividade ${conectividade}}`,
    ...linhasEmpilha(conectividade, '      '),
    '    fim-se',
    '  fim-enquanto',
    `fim {procedimento ${nome}}`,
  ].join('\n');
}

/** Listagem da conectividade 4 (14 linhas). */
export const CODIGO_FLOOD_FILL = listagem(4);
/** Listagem da conectividade 8 (16 linhas: + 2 linhas com as diagonais). */
export const CODIGO_FLOOD_FILL_8 = listagem(8);

/**
 * Cria o algoritmo cuja listagem corresponde à conectividade `listagemDe`. O comportamento segue
 * `params.conectividade`; use `algoritmoFloodFillPara` para que listagem e execução coincidam.
 */
function criarFloodFill(listagemDe: 4 | 8): Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> {
  return {
    id: 'flood-fill',
    nome: listagemDe === 4 ? 'Flood Fill (conectividade 4)' : 'Flood Fill (conectividade 8)',
    codigo: listagem(listagemDe),
    *executar(params: ParametrosPreenchimento): Generator<Passo, ResultadoPreenchimento, void> {
      const { x, y, corPreenche } = params;
      // cor_antiga é a cor do interior: se não vier nos parâmetros, é a cor da própria semente.
      const corAntiga = params.corAntiga ?? params.matriz.inquirirCor(x, y);

      // Linha 3: guarda cor_antiga = cor_preenche
      const variaveis = {
        x,
        y,
        cor_atual: null,
        cor_preenche: cor(corPreenche),
        cor_antiga: cor(corAntiga),
        pilha: snapshotPilha([]),
        pintados: 0,
      };
      if (corAntiga === corPreenche) {
        yield passo(3, variaveis, {
          descricao: `cor_antiga = cor_preenche (${cor(corPreenche)}): não há o que recolorir; retorna`,
        });
        return { pixels: [], total: 0 };
      }
      yield passo(3, variaveis, {
        descricao: `cor_antiga (${cor(corAntiga)}) ≠ cor_preenche (${cor(corPreenche)}): segue`,
      });

      return yield* lacoPreenchimento(params, {
        linhas: {
          empilhaSemente: 4,
          desempilha: 6,
          decisao: 7,
          setPixel: 8,
          ultimoEmpilha: listagemDe === 4 ? 11 : 13,
        },
        fixas: { cor_antiga: cor(corAntiga) },
        testar(corAtual) {
          return corAtual === corAntiga ? null : `cor_atual (${cor(corAtual)}) ≠ cor_antiga (${cor(corAntiga)})`;
        },
        motivoPinta() {
          return `cor_atual = cor_antiga (${cor(corAntiga)})`;
        },
      });
    },
  };
}

/** Flood Fill com a listagem da conectividade 4 (o registrado em `core/registro.ts`). */
export const algoritmoFloodFill = criarFloodFill(4);
/** Flood Fill com a listagem da conectividade 8. */
export const algoritmoFloodFill8 = criarFloodFill(8);

/** Algoritmo cuja listagem corresponde à conectividade escolhida. */
export function algoritmoFloodFillPara(conectividade: 4 | 8): Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> {
  return conectividade === 4 ? algoritmoFloodFill : algoritmoFloodFill8;
}
