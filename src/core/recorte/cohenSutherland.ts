/**
 * Recorte de retas de Cohen-Sutherland — slides "CG 07 Recorte" (slides 9 a 13).
 *
 * Ideia dos slides: cada extremo recebe um código de região de 4 bits (`region_code`).
 *  - c1 = 0 e c2 = 0            → a reta está toda dentro: aceita.
 *  - (c1 AND c2) ≠ 0            → os dois extremos estão do mesmo lado de fora: rejeita.
 *  - caso contrário              → escolhe um extremo de fora (`cfora`), calcula a interseção
 *                                  (xint, yint) com a fronteira de um bit ligado, troca o extremo
 *                                  pela interseção e repete.
 * No fim, se aceita, a parte visível é desenhada com Bresenham (`desenha_linha` com round).
 *
 * Cada `yield` espelha UMA linha da listagem `CODIGO_COHEN_SUTHERLAND`. A chamada
 * `region_code` é um sub-generator (`yield*`): a execução entra na função, linha a linha.
 */
import { passo, type Algoritmo, type Overlay, type Passo, type Pixel, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import { formatarNumero, quaseInteiro, round } from '../geometria';
import { rasterizarReta } from '../rasterizacao/rasterizar';
import { extensao, fmtPonto, fronteira, NOME_FRONTEIRA, type ParametrosRecorte, type ResultadoRecorte } from './comum';
import { bit, bitsDe, formatarCodigo, nomeDaRegiao } from './regiaoCodigo';

export type { ParametrosRecorte, ResultadoRecorte } from './comum';

export const CODIGO_COHEN_SUTHERLAND = [
  'var xmin, xmax, ymin, ymax  {limites da janela}',
  'função region_code(x, y)',
  '  código = 0',
  '  se x < xmin então código = código + 1  {esquerda, bit 0}',
  '  se x > xmax então código = código + 2  {direita, bit 1}',
  '  se y < ymin então código = código + 4  {abaixo, bit 2}',
  '  se y > ymax então código = código + 8  {acima, bit 3}',
  '  retorna código',
  'fim {função region_code}',
  'procedimento Cohen-Sutherland(x1, y1, x2, y2)',
  '  aceite = Falso;  feito = Falso',
  '  enquanto não feito faça',
  '    c1 = region_code(x1, y1)',
  '    c2 = region_code(x2, y2)',
  '    se (c1 = 0) e (c2 = 0) então  {dentro}',
  '      aceite = Verdade;  feito = Verdade',
  '    senão se (c1 e c2) <> 0 então  {fora}',
  '      feito = Verdade',
  '    senão',
  '      se c1 <> 0 então cfora = c1',
  '      senão cfora = c2',
  '      se bit(cfora, 0) = 1 então  {esquerda}',
  '        xint = xmin',
  '        yint = y1+(y2-y1)*(xmin-x1)/(x2-x1)',
  '      senão se bit(cfora, 1) = 1 então  {direita}',
  '        xint = xmax',
  '        yint = y1+(y2-y1)*(xmax-x1)/(x2-x1)',
  '      senão se bit(cfora, 2) = 1 então  {abaixo}',
  '        yint = ymin',
  '        xint = x1+(x2-x1)*(ymin-y1)/(y2-y1)',
  '      senão se bit(cfora, 3) = 1 então  {acima}',
  '        yint = ymax',
  '        xint = x1+(x2-x1)*(ymax-y1)/(y2-y1)',
  '      fim {se}',
  '      se c1 = cfora então',
  '        x1 = xint;  y1 = yint',
  '      senão',
  '        x2 = xint;  y2 = yint',
  '    fim {se}',
  '  fim {enquanto}',
  '  se aceite então',
  '    desenha_linha(round(x1), round(y1), round(x2), round(y2))',
  'fim {procedimento Cohen-Sutherland}',
].join('\n');

/** Números das linhas da listagem (1-based), para não espalhar números mágicos pelo generator. */
const L = {
  var: 1,
  rcCodigo0: 3,
  rcTestes: [4, 5, 6, 7] as const,
  rcRetorna: 8,
  procedimento: 10,
  inicializa: 11,
  enquanto: 12,
  c1: 13,
  c2: 14,
  seDentro: 15,
  aceita: 16,
  seFora: 17,
  rejeita: 18,
  cforaC1: 20,
  cforaC2: 21,
  testeBit: [22, 25, 28, 31] as const,
  /** Primeira linha da interseção: a coordenada fixada pela fronteira (xint = xmin...). */
  fixaInt: [23, 26, 29, 32] as const,
  /** Segunda linha: a outra coordenada, pela equação da reta. */
  calculaInt: [24, 27, 30, 33] as const,
  seTroca: 35,
  trocaP1: 36,
  trocaP2: 38,
  seAceite: 41,
  desenha: 42,
} as const;

/** Limite de segurança: o algoritmo termina em no máximo 5 iterações; acima disso há erro numérico. */
const MAX_ITERACOES = 20;

const ROTULO_BIT = ['E', 'D', 'B', 'C'];

/** Número para as contas das descrições: negativos entre parênteses ("0 − (−1)"). */
function num(v: number): string {
  return v < 0 ? `(${formatarNumero(v)})` : formatarNumero(v);
}

export const algoritmoCohenSutherland: Algoritmo<ParametrosRecorte, ResultadoRecorte> = {
  id: 'cohen-sutherland',
  nome: 'Cohen-Sutherland',
  codigo: CODIGO_COHEN_SUTHERLAND,

  *executar(params: ParametrosRecorte): Generator<Passo, ResultadoRecorte, void> {
    const j = params.janela;
    const { xmin, xmax, ymin, ymax } = j;
    let { x1, y1, x2, y2 } = params;
    const ext = extensao(j, x1, y1, x2, y2);

    // Snapshot completo e com ordem fixa: as variáveis ainda sem valor aparecem como "—".
    const v: Variaveis = {
      xmin, xmax, ymin, ymax,
      x1, y1, x2, y2,
      c1: null, c2: null, cfora: null,
      xint: null, yint: null,
      aceite: null, feito: null,
      iteracao: 0,
    };
    const snap = (): Variaveis => ({ ...v });

    // Overlays base: segmento atual (x1,y1)-(x2,y2) e seus extremos com o código, quando conhecido.
    let rotuloC1 = '';
    let rotuloC2 = '';
    const base = (): Overlay[] => [
      { tipo: 'segmento', x1, y1, x2, y2, cor: COR_OVERLAY.destaque },
      { tipo: 'ponto-real', x: x1, y: y1, cor: COR_OVERLAY.destaque, rotulo: `P1${rotuloC1}` },
      { tipo: 'ponto-real', x: x2, y: y2, cor: COR_OVERLAY.destaque, rotulo: `P2${rotuloC2}` },
    ];

    /** Sub-generator `region_code(x, y)`: entra na função e percorre as linhas 3 a 8. */
    function* regionCode(x: number, y: number, nome: 'P1' | 'P2'): Generator<Passo, number, void> {
      let codigo = 0;
      const local = (): Variaveis => ({ ...snap(), x, y, 'código': bitsDe(codigo) });
      const alvo: Overlay = { tipo: 'ponto-real', x, y, cor: COR_OVERLAY.selecao, rotulo: `${nome} ${fmtPonto(x, y)}` };

      yield passo(L.rcCodigo0, local(), {
        overlays: [...base(), alvo],
        descricao: `Entra em region_code com (x, y) = ${nome} ${fmtPonto(x, y)}: código = 0`,
      });

      const testes: Array<{ cond: boolean; texto: string }> = [
        { cond: x < xmin, texto: `x < xmin? ${formatarNumero(x)} < ${formatarNumero(xmin)}` },
        { cond: x > xmax, texto: `x > xmax? ${formatarNumero(x)} > ${formatarNumero(xmax)}` },
        { cond: y < ymin, texto: `y < ymin? ${formatarNumero(y)} < ${formatarNumero(ymin)}` },
        { cond: y > ymax, texto: `y > ymax? ${formatarNumero(y)} > ${formatarNumero(ymax)}` },
      ];
      for (let n = 0; n < 4; n++) {
        const { cond, texto } = testes[n];
        if (cond) codigo += 1 << n;
        yield passo(L.rcTestes[n], local(), {
          overlays: [...base(), fronteira(n, j, ext), alvo],
          descricao: cond
            ? `${texto} → Verdade: liga o bit ${n} (${ROTULO_BIT[n]}); código = ${formatarCodigo(codigo)}`
            : `${texto} → Falso: o bit ${n} (${ROTULO_BIT[n]}) fica 0`,
        });
      }

      yield passo(L.rcRetorna, local(), {
        overlays: [...base(), alvo],
        descricao: `Retorna ${formatarCodigo(codigo)} (${nomeDaRegiao(codigo)})`,
      });
      return codigo;
    }

    // Linha 1: limites da janela
    yield passo(L.var, snap(), {
      overlays: base(),
      descricao: `Janela de recorte: x ∈ [${formatarNumero(xmin)}, ${formatarNumero(xmax)}], y ∈ [${formatarNumero(ymin)}, ${formatarNumero(ymax)}]`,
    });

    // Linha 10: parâmetros
    yield passo(L.procedimento, snap(), {
      overlays: base(),
      descricao: `Recorta a reta de P1 ${fmtPonto(x1, y1)} a P2 ${fmtPonto(x2, y2)}`,
    });

    // Linha 11
    let aceite = false;
    let feito = false;
    v.aceite = aceite;
    v.feito = feito;
    yield passo(L.inicializa, snap(), { overlays: base(), descricao: 'aceite = Falso; feito = Falso' });

    let iteracao = 0;
    while (!feito) {
      iteracao += 1;
      if (iteracao > MAX_ITERACOES) throw new Error('o recorte não convergiu (erro numérico)');
      v.iteracao = iteracao;
      rotuloC1 = '';
      rotuloC2 = '';
      // Linha 12: teste do laço (verdadeiro)
      yield passo(L.enquanto, snap(), { overlays: base(), descricao: `feito = Falso: iteração ${iteracao}` });

      // Linha 13: c1 = region_code(x1, y1)
      const c1 = yield* regionCode(x1, y1, 'P1');
      v.c1 = bitsDe(c1);
      rotuloC1 = ` ${formatarCodigo(c1)}`;
      yield passo(L.c1, snap(), {
        overlays: base(),
        descricao: `c1 = ${formatarCodigo(c1)}: P1 está ${nomeDaRegiao(c1)}`,
      });

      // Linha 14: c2 = region_code(x2, y2)
      const c2 = yield* regionCode(x2, y2, 'P2');
      v.c2 = bitsDe(c2);
      rotuloC2 = ` ${formatarCodigo(c2)}`;
      yield passo(L.c2, snap(), {
        overlays: base(),
        descricao: `c2 = ${formatarCodigo(c2)}: P2 está ${nomeDaRegiao(c2)}`,
      });

      // Linha 15: completamente dentro?
      const dentro = c1 === 0 && c2 === 0;
      yield passo(L.seDentro, snap(), {
        overlays: base(),
        descricao: dentro
          ? 'c1 = 0 e c2 = 0: os dois extremos estão dentro da janela'
          : `c1 = 0 e c2 = 0? Falso (c1 = ${formatarCodigo(c1)}, c2 = ${formatarCodigo(c2)})`,
      });
      if (dentro) {
        // Linha 16
        aceite = true;
        feito = true;
        v.aceite = aceite;
        v.feito = feito;
        yield passo(L.aceita, snap(), { overlays: base(), descricao: 'Segmento completamente dentro: aceite = Verdade; feito = Verdade' });
        break;
      }

      // Linha 17: completamente fora?
      const e = c1 & c2;
      const fora = e !== 0;
      yield passo(L.seFora, snap(), {
        overlays: base(),
        descricao: fora
          ? `c1 AND c2 = ${formatarCodigo(c1)} AND ${formatarCodigo(c2)} = ${formatarCodigo(e)} ≠ 0: totalmente fora (c1 AND c2 ≠ 0)`
          : `c1 AND c2 = ${formatarCodigo(c1)} AND ${formatarCodigo(c2)} = 0000: parcialmente dentro, é preciso recortar`,
      });
      if (fora) {
        // Linha 18
        feito = true;
        v.feito = feito;
        yield passo(L.rejeita, snap(), {
          overlays: base(),
          descricao: 'Reta rejeitada: totalmente fora (c1 AND c2 ≠ 0); feito = Verdade',
        });
        break;
      }

      // Linhas 20/21: escolhe o extremo de fora
      const cfora = c1 !== 0 ? c1 : c2;
      v.cfora = bitsDe(cfora);
      yield passo(c1 !== 0 ? L.cforaC1 : L.cforaC2, snap(), {
        overlays: base(),
        descricao:
          c1 !== 0
            ? `c1 ≠ 0: P1 está fora; cfora = c1 = ${formatarCodigo(cfora)}`
            : `c1 = 0: P2 é o extremo de fora; cfora = c2 = ${formatarCodigo(cfora)}`,
      });

      // Linhas 22-33: primeira fronteira (na ordem E, D, B, C) cujo bit está ligado em cfora
      let n = 0;
      while (bit(cfora, n) !== 1) {
        yield passo(L.testeBit[n], snap(), {
          overlays: [...base(), fronteira(n, j, ext)],
          descricao: `bit(cfora, ${n}) = 0: o extremo não está além da fronteira ${NOME_FRONTEIRA[n]}`,
        });
        n += 1;
      }
      yield passo(L.testeBit[n], snap(), {
        overlays: [...base(), fronteira(n, j, ext)],
        descricao: `bit(cfora, ${n}) = 1: calcula a interseção com a fronteira ${NOME_FRONTEIRA[n]}`,
      });

      // Primeira linha: a coordenada fixada pela fronteira. Segunda: a outra, pela equação da reta.
      const vertical = n === 0 || n === 1;
      const nomeLimite = ['xmin', 'xmax', 'ymin', 'ymax'][n];
      const limite = [xmin, xmax, ymin, ymax][n];
      let xint: number;
      let yint: number;
      if (vertical) {
        xint = limite;
        v.xint = xint;
      } else {
        yint = limite;
        v.yint = yint;
      }
      yield passo(L.fixaInt[n], snap(), {
        overlays: [...base(), fronteira(n, j, ext)],
        descricao: `${vertical ? 'xint' : 'yint'} = ${nomeLimite} = ${formatarNumero(limite)}: a interseção está sobre esta fronteira`,
      });

      let conta: string;
      if (vertical) {
        xint = limite;
        yint = quaseInteiro(y1 + ((y2 - y1) * (xint - x1)) / (x2 - x1)) + 0; // "+ 0": nunca −0
        conta = `yint = ${num(y1)} + (${num(y2)} − ${num(y1)})·(${num(xint)} − ${num(x1)}) / (${num(x2)} − ${num(x1)}) = ${formatarNumero(yint)}`;
      } else {
        yint = limite;
        xint = quaseInteiro(x1 + ((x2 - x1) * (yint - y1)) / (y2 - y1)) + 0;
        conta = `xint = ${num(x1)} + (${num(x2)} − ${num(x1)})·(${num(yint)} − ${num(y1)}) / (${num(y2)} − ${num(y1)}) = ${formatarNumero(xint)}`;
      }
      v.xint = xint;
      v.yint = yint;
      const pontoInt: Overlay = {
        tipo: 'ponto-real',
        x: xint,
        y: yint,
        cor: COR_OVERLAY.janela,
        rotulo: `(xint, yint) = ${fmtPonto(xint, yint)}`,
      };
      yield passo(L.calculaInt[n], snap(), { overlays: [...base(), fronteira(n, j, ext), pontoInt], descricao: conta });

      // Linha 35: qual extremo está fora?
      const trocaP1 = c1 === cfora;
      yield passo(L.seTroca, snap(), {
        overlays: [...base(), pontoInt],
        descricao: trocaP1 ? 'c1 = cfora: o extremo de fora é P1' : 'c1 ≠ cfora: o extremo de fora é P2',
      });

      // Linhas 36/38: o extremo de fora é substituído pela interseção
      if (trocaP1) {
        x1 = xint;
        y1 = yint;
        v.x1 = x1;
        v.y1 = y1;
        rotuloC1 = '';
      } else {
        x2 = xint;
        y2 = yint;
        v.x2 = x2;
        v.y2 = y2;
        rotuloC2 = '';
      }
      yield passo(trocaP1 ? L.trocaP1 : L.trocaP2, snap(), {
        overlays: [...base(), pontoInt],
        descricao: `${trocaP1 ? 'P1' : 'P2'} passa a ser a interseção ${fmtPonto(xint, yint)}; a parte de fora é descartada`,
      });
    }

    // Linha 12 (falso): sai do laço
    yield passo(L.enquanto, snap(), { overlays: base(), descricao: 'feito = Verdade: sai do laço' });

    // Linha 41
    yield passo(L.seAceite, snap(), {
      overlays: base(),
      descricao: aceite
        ? 'aceite = Verdade: desenha a parte visível'
        : 'aceite = Falso: a reta está totalmente fora (c1 AND c2 ≠ 0) e nada é desenhado',
    });
    if (!aceite) return { aceito: false, segmento: null, pixels: [] };

    // Linha 42: desenha_linha com Bresenham sobre os extremos arredondados
    const a = { x: round(x1), y: round(y1) };
    const b = { x: round(x2), y: round(y2) };
    const pixels: Pixel[] = rasterizarReta(a, b, 'bresenham');
    yield passo(L.desenha, snap(), {
      pixels,
      overlays: base(),
      descricao: `desenha_linha(${a.x}, ${a.y}, ${b.x}, ${b.y}): extremos arredondados, ${pixels.length} pixels com Bresenham`,
    });

    return { aceito: true, segmento: { x1, y1, x2, y2 }, pixels };
  },
};
