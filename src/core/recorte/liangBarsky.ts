/**
 * Recorte de retas de Liang-Barsky — slides "CG 07 Recorte" (slides 14 a 21).
 *
 * Ideia dos slides: a reta é escrita na forma paramétrica P(u) = P1 + u·(P2 − P1), u ∈ [0, 1].
 * Um ponto está dentro da janela quando p_k·u ≤ q_k para as 4 fronteiras k:
 *
 *   k = 1 (esquerda): p1 = −dx, q1 = x1 − xmin      k = 3 (abaixo): p3 = −dy, q3 = y1 − ymin
 *   k = 2 (direita):  p2 =  dx, q2 = xmax − x1      k = 4 (acima):  p4 =  dy, q4 = ymax − y1
 *
 * `cliptest(p, q, u1, u2)` trata uma fronteira: p < 0 → a reta entra (fora → dentro) e r = q/p
 * pode aumentar u1; p > 0 → a reta sai e r pode diminuir u2; p = 0 → paralela, rejeita se q < 0.
 * Se u1 > u2 em algum momento, não há parte visível. Ao fim, P(u1)–P(u2) é o segmento recortado.
 *
 * Cada `yield` espelha UMA linha de `CODIGO_LIANG_BARSKY`. `cliptest` é um sub-generator
 * (`yield*`): a linha destacada entra na função a cada chamada.
 */
import { passo, type Algoritmo, type Overlay, type Passo, type Pixel, type Valor, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import { formatarNumero, quaseInteiro, round } from '../geometria';
import { rasterizarReta } from '../rasterizacao/rasterizar';
import { extensao, fmtPonto, fronteira, NOME_FRONTEIRA, type ParametrosRecorte, type ResultadoRecorte } from './comum';

export type { ParametrosRecorte, ResultadoRecorte } from './comum';

export const CODIGO_LIANG_BARSKY = [
  'var xmin, xmax, ymin, ymax;                 {limites da janela}',
  'função cliptest(p, q, u1, u2)',
  '  result = Verdade',
  '  se p < 0.0 então                          {fora para dentro}',
  '    r = q / p',
  '    se r > u2 então result = Falso',
  '    senão se r > u1 então u1 = r',
  '  senão se p > 0.0 então                    {dentro para fora}',
  '    r = q / p',
  '    se r < u1 então result = Falso',
  '    senão se r < u2 então u2 = r',
  '  senão se q < 0.0 então result = Falso     {paralela e fora}',
  '  fim {se}',
  '  retorna result',
  'fim {função cliptest}',
  'procedimento Liang-Barsky(x1, y1, x2, y2)',
  '  u1 = 0.0;  u2 = 1.0',
  '  dx = x2 - x1',
  '  dy = y2 - y1',
  '  se cliptest(-dx, x1 - xmin, u1, u2) então           {k = 1: esquerda}',
  '    se cliptest(dx, xmax - x1, u1, u2) então          {k = 2: direita}',
  '      se cliptest(-dy, y1 - ymin, u1, u2) então       {k = 3: abaixo}',
  '        se cliptest(dy, ymax - y1, u1, u2) então      {k = 4: acima}',
  '          se u2 < 1.0 então',
  '            x2 = x1 + u2*dx',
  '            y2 = y1 + u2*dy',
  '          fim {se}',
  '          se u1 > 0.0 então',
  '            x1 = x1 + u1*dx',
  '            y1 = y1 + u1*dy',
  '          fim {se}',
  '          desenha_linha(round(x1), round(y1), round(x2), round(y2))',
  '        fim {se}  fim {se}  fim {se}  fim {se}',
  'fim {procedimento Liang-Barsky}',
].join('\n');

/** Números das linhas da listagem (1-based). */
const L = {
  var: 1,
  ctResult: 3,
  ctSeNeg: 4,
  ctRNeg: 5,
  ctRMaiorU2: 6,
  ctRMaiorU1: 7,
  ctSePos: 8,
  ctRPos: 9,
  ctRMenorU1: 10,
  ctRMenorU2: 11,
  ctParalela: 12,
  ctRetorna: 14,
  procedimento: 16,
  inicializa: 17,
  dx: 18,
  dy: 19,
  chamadas: [20, 21, 22, 23] as const,
  seU2: 24,
  novoX2: 25,
  novoY2: 26,
  seU1: 28,
  novoX1: 29,
  novoY1: 30,
  desenha: 32,
  fim: 34,
} as const;

/** Número para as contas das descrições: negativos entre parênteses ("0 − (−1)"). */
function num(v: number): string {
  return v < 0 ? `(${formatarNumero(v)})` : formatarNumero(v);
}

export const COLUNAS_TABELA_LB = ['k', 'p_k', 'q_k', 'r_k', 'u1', 'u2', 'resultado'];

export const algoritmoLiangBarsky: Algoritmo<ParametrosRecorte, ResultadoRecorte> = {
  id: 'liang-barsky',
  nome: 'Liang-Barsky',
  codigo: CODIGO_LIANG_BARSKY,

  *executar(params: ParametrosRecorte): Generator<Passo, ResultadoRecorte, void> {
    const j = params.janela;
    const { xmin, xmax, ymin, ymax } = j;
    let { x1, y1, x2, y2 } = params;
    // Extremos originais: P(u) é sempre calculado sobre a reta original (u1/u2 referem-se a ela).
    const ox = x1;
    const oy = y1;
    const ext = extensao(j, x1, y1, x2, y2);

    let u1 = 0;
    let u2 = 1;
    let dx = 0;
    let dy = 0;
    let iniciado = false; // u1/u2 já definidos (linha 17)
    const linhas: Valor[][] = [];

    // Snapshot completo e com ordem fixa ("—" para o que ainda não tem valor).
    const v: Variaveis = {
      xmin, xmax, ymin, ymax,
      x1, y1, x2, y2,
      u1: null, u2: null,
      dx: null, dy: null,
      k: null, p: null, q: null, r: null, result: null,
    };
    const snap = (): Variaveis => ({
      ...v,
      tabela: { tipo: 'tabela', colunas: COLUNAS_TABELA_LB, linhas: linhas.map((l) => [...l]) },
    });

    const P = (u: number) => ({ x: quaseInteiro(ox + u * dx) + 0, y: quaseInteiro(oy + u * dy) + 0 });

    /** Overlays base: segmento P(u1)–P(u2) com os dois pontos (antes da linha 17, P1–P2). */
    const base = (): Overlay[] => {
      if (!iniciado) {
        return [
          { tipo: 'segmento', x1, y1, x2, y2, cor: COR_OVERLAY.destaque },
          { tipo: 'ponto-real', x: x1, y: y1, cor: COR_OVERLAY.destaque, rotulo: 'P1' },
          { tipo: 'ponto-real', x: x2, y: y2, cor: COR_OVERLAY.destaque, rotulo: 'P2' },
        ];
      }
      const a = P(u1);
      const b = P(u2);
      const lista: Overlay[] = [];
      if (u1 <= u2) lista.push({ tipo: 'segmento', x1: a.x, y1: a.y, x2: b.x, y2: b.y, cor: COR_OVERLAY.destaque });
      lista.push(
        { tipo: 'ponto-real', x: a.x, y: a.y, cor: COR_OVERLAY.destaque, rotulo: `P(u1), u1 = ${formatarNumero(u1)}` },
        { tipo: 'ponto-real', x: b.x, y: b.y, cor: COR_OVERLAY.selecao, rotulo: `P(u2), u2 = ${formatarNumero(u2)}` },
      );
      return lista;
    };

    /**
     * Sub-generator `cliptest(p, q, u1, u2)` para a fronteira `k` (1..4). u1 e u2 são passados
     * "por referência" (como nos slides): a função altera diretamente as variáveis do procedimento.
     */
    function* cliptest(p: number, q: number, k: number): Generator<Passo, boolean, void> {
      const n = k - 1;
      const linha = linhas[linhas.length - 1]; // linha k da tabela, criada na chamada
      const borda = fronteira(n, j, ext);
      let result = true;
      v.result = result;
      v.r = null;
      yield passo(L.ctResult, snap(), {
        overlays: [...base(), borda],
        descricao: `Entra em cliptest com p = ${formatarNumero(p)}, q = ${formatarNumero(q)} (fronteira ${NOME_FRONTEIRA[n]}): result = Verdade`,
      });

      /** Ponto de interseção com a fronteira, P(r). */
      const pontoR = (r: number): Overlay => {
        const pr = P(r);
        return { tipo: 'ponto-real', x: pr.x, y: pr.y, cor: COR_OVERLAY.janela, rotulo: `P(r), r = ${formatarNumero(r)}` };
      };

      yield passo(L.ctSeNeg, snap(), {
        overlays: [...base(), borda],
        descricao:
          p < 0
            ? `p = ${formatarNumero(p)} < 0: a reta segue de fora para dentro nesta fronteira (candidata a u1)`
            : `p < 0? Falso (p = ${formatarNumero(p)})`,
      });

      if (p < 0) {
        const r = q / p;
        v.r = r;
        linha[3] = r;
        yield passo(L.ctRNeg, snap(), {
          overlays: [...base(), borda, pontoR(r)],
          descricao: `r = q / p = ${formatarNumero(q)} / ${num(p)} = ${formatarNumero(r)}`,
        });
        if (r > u2) {
          result = false;
          v.result = result;
          yield passo(L.ctRMaiorU2, snap(), {
            overlays: [...base(), borda, pontoR(r)],
            descricao: `r = ${formatarNumero(r)} > u2 = ${formatarNumero(u2)}: entraria depois de sair; result = Falso`,
          });
        } else {
          yield passo(L.ctRMaiorU2, snap(), {
            overlays: [...base(), borda, pontoR(r)],
            descricao: `r > u2? Falso (${formatarNumero(r)} ≤ ${formatarNumero(u2)})`,
          });
          const muda = r > u1;
          if (muda) {
            u1 = r;
            v.u1 = u1;
            linha[4] = u1;
          }
          yield passo(L.ctRMaiorU1, snap(), {
            overlays: [...base(), borda, pontoR(r)],
            descricao: muda
              ? `r = ${formatarNumero(r)} > u1: u1 = ${formatarNumero(u1)} (o início visível avança)`
              : `r > u1? Falso (${formatarNumero(r)} ≤ ${formatarNumero(u1)}): u1 não muda`,
          });
        }
      } else {
        yield passo(L.ctSePos, snap(), {
          overlays: [...base(), borda],
          descricao:
            p > 0
              ? `p = ${formatarNumero(p)} > 0: a reta segue de dentro para fora nesta fronteira (candidata a u2)`
              : 'p > 0? Falso: p = 0, a reta é paralela a esta fronteira',
        });
        if (p > 0) {
          const r = q / p;
          v.r = r;
          linha[3] = r;
          yield passo(L.ctRPos, snap(), {
            overlays: [...base(), borda, pontoR(r)],
            descricao: `r = q / p = ${formatarNumero(q)} / ${num(p)} = ${formatarNumero(r)}`,
          });
          if (r < u1) {
            result = false;
            v.result = result;
            yield passo(L.ctRMenorU1, snap(), {
              overlays: [...base(), borda, pontoR(r)],
              descricao: `r = ${formatarNumero(r)} < u1 = ${formatarNumero(u1)}: sairia antes de entrar; result = Falso`,
            });
          } else {
            yield passo(L.ctRMenorU1, snap(), {
              overlays: [...base(), borda, pontoR(r)],
              descricao: `r < u1? Falso (${formatarNumero(r)} ≥ ${formatarNumero(u1)})`,
            });
            const muda = r < u2;
            if (muda) {
              u2 = r;
              v.u2 = u2;
              linha[5] = u2;
            }
            yield passo(L.ctRMenorU2, snap(), {
              overlays: [...base(), borda, pontoR(r)],
              descricao: muda
                ? `r = ${formatarNumero(r)} < u2: u2 = ${formatarNumero(u2)} (o fim visível recua)`
                : `r < u2? Falso (${formatarNumero(r)} ≥ ${formatarNumero(u2)}): u2 não muda`,
            });
          }
        } else {
          if (q < 0) {
            result = false;
            v.result = result;
          }
          yield passo(L.ctParalela, snap(), {
            overlays: [...base(), borda],
            descricao:
              q < 0
                ? `p = 0 e q = ${formatarNumero(q)} < 0: paralela e fora da janela; result = Falso`
                : `p = 0 e q = ${formatarNumero(q)} ≥ 0: paralela e do lado de dentro; nada muda`,
          });
        }
      }

      linha[6] = result;
      yield passo(L.ctRetorna, snap(), {
        overlays: [...base(), borda],
        descricao: `Retorna ${result ? 'Verdade' : 'Falso'} (u1 = ${formatarNumero(u1)}, u2 = ${formatarNumero(u2)})`,
      });
      return result;
    }

    // Linha 1: limites da janela
    yield passo(L.var, snap(), {
      overlays: base(),
      descricao: `Janela de recorte: x ∈ [${formatarNumero(xmin)}, ${formatarNumero(xmax)}], y ∈ [${formatarNumero(ymin)}, ${formatarNumero(ymax)}]`,
    });

    // Linha 16
    yield passo(L.procedimento, snap(), {
      overlays: base(),
      descricao: `Recorta a reta de P1 ${fmtPonto(x1, y1)} a P2 ${fmtPonto(x2, y2)}`,
    });

    // Linha 17: todo o segmento, u ∈ [0, 1]
    dx = x2 - x1;
    dy = y2 - y1;
    iniciado = true;
    v.u1 = u1;
    v.u2 = u2;
    yield passo(L.inicializa, snap(), { overlays: base(), descricao: 'u1 = 0 (P1) e u2 = 1 (P2): começa com a reta inteira' });

    // Linhas 18 e 19
    v.dx = dx;
    yield passo(L.dx, snap(), { overlays: base(), descricao: `dx = ${formatarNumero(x2)} − ${formatarNumero(x1)} = ${formatarNumero(dx)}` });
    v.dy = dy;
    yield passo(L.dy, snap(), { overlays: base(), descricao: `dy = ${formatarNumero(y2)} − ${formatarNumero(y1)} = ${formatarNumero(dy)}` });

    // Linhas 20-23: um cliptest por fronteira, aninhados (o primeiro Falso interrompe)
    const pk = [-dx, dx, -dy, dy];
    const qk = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    const textoP = ['-dx', 'dx', '-dy', 'dy'];
    const textoQ = ['x1 - xmin', 'xmax - x1', 'y1 - ymin', 'ymax - y1'];
    for (let n = 0; n < 4; n++) {
      const k = n + 1;
      const p = quaseInteiro(pk[n]) + 0; // "+ 0" troca −0 (de −dx com dx = 0) por 0
      const q = quaseInteiro(qk[n]) + 0;
      v.k = k;
      v.p = p;
      v.q = q;
      v.r = null;
      v.result = null;
      linhas.push([k, p, q, null, u1, u2, null]);
      yield passo(L.chamadas[n], snap(), {
        overlays: [...base(), fronteira(n, j, ext)],
        descricao: `k = ${k} (${NOME_FRONTEIRA[n]}): chama cliptest(p = ${textoP[n]} = ${formatarNumero(p)}, q = ${textoQ[n]} = ${formatarNumero(q)})`,
      });

      const ok = yield* cliptest(p, q, k);
      if (!ok) {
        yield passo(L.chamadas[n], snap(), {
          overlays: base(),
          descricao: `cliptest retornou Falso na fronteira k = ${k}: a reta está totalmente fora e é rejeitada`,
        });
        yield passo(L.fim, snap(), { overlays: base(), descricao: 'Fim: nenhum pixel é desenhado' });
        return { aceito: false, segmento: null, pixels: [] };
      }
    }

    // Linhas 24-26: recua P2 para P(u2). x2/y2 usam x1/y1 originais (P1 só muda depois).
    yield passo(L.seU2, snap(), {
      overlays: base(),
      descricao: u2 < 1 ? `u2 = ${formatarNumero(u2)} < 1: P2 é substituído por P(u2)` : 'u2 < 1? Falso: P2 já está dentro, não muda',
    });
    if (u2 < 1) {
      const pu2 = P(u2);
      x2 = pu2.x;
      v.x2 = x2;
      yield passo(L.novoX2, snap(), {
        overlays: base(),
        descricao: `x2 = x1 + u2·dx = ${num(x1)} + ${num(u2)}·${num(dx)} = ${formatarNumero(x2)}`,
      });
      y2 = pu2.y;
      v.y2 = y2;
      yield passo(L.novoY2, snap(), {
        overlays: base(),
        descricao: `y2 = y1 + u2·dy = ${num(y1)} + ${num(u2)}·${num(dy)} = ${formatarNumero(y2)}`,
      });
    }

    // Linhas 28-30: avança P1 para P(u1)
    yield passo(L.seU1, snap(), {
      overlays: base(),
      descricao: u1 > 0 ? `u1 = ${formatarNumero(u1)} > 0: P1 é substituído por P(u1)` : 'u1 > 0? Falso: P1 já está dentro, não muda',
    });
    if (u1 > 0) {
      const pu1 = P(u1);
      const x1Antigo = x1;
      x1 = pu1.x;
      v.x1 = x1;
      yield passo(L.novoX1, snap(), {
        overlays: base(),
        descricao: `x1 = x1 + u1·dx = ${num(x1Antigo)} + ${num(u1)}·${num(dx)} = ${formatarNumero(x1)}`,
      });
      const y1Antigo = y1;
      y1 = pu1.y;
      v.y1 = y1;
      yield passo(L.novoY1, snap(), {
        overlays: base(),
        descricao: `y1 = y1 + u1·dy = ${num(y1Antigo)} + ${num(u1)}·${num(dy)} = ${formatarNumero(y1)}`,
      });
    }

    // Linha 32: desenha_linha com Bresenham sobre os extremos arredondados
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
