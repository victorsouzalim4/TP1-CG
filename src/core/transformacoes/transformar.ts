/**
 * Transformações geométricas 2D aplicadas passo a passo aos objetos selecionados — slides
 * "CG 02 Transf 2D".
 *
 * Todos os vértices são levados a coordenadas homogêneas P = (x, y, 1) e multiplicados pela
 * matriz composta M (montada por `montarMatriz`):
 *
 *     x' = m11·x + m12·y + m13
 *     y' = m21·x + m22·y + m23
 *
 * Depois que todos os vértices de um objeto foram transformados, o objeto é rasterizado de novo
 * (os vértices ficam reais; só se arredonda ao rasterizar).
 *
 * Cada `yield` espelha UMA linha da listagem `CODIGO_TRANSFORMACAO` (numeração 1-based).
 */
import { passo, type Algoritmo, type Matriz3, type Overlay, type Passo, type Pixel, type Ponto, type Valor, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import { arredondar, formatarNumero, quaseInteiro } from '../geometria';
import { aplicarPonto, paraValor, pontoParaValor } from '../matriz';
import { transformarObjeto, verticesDe, type ObjetoGrafico } from '../cena/objetos';
import { rasterizarObjeto } from '../rasterizacao/rasterizar';

export interface ParametrosTransformacao {
  /** Objetos (já selecionados) que serão transformados. */
  objetos: ObjetoGrafico[];
  /** Matriz final (produto de `composicao`). */
  matriz: Matriz3;
  /** Fatores da composição, na ordem de multiplicação (a última é a primeira aplicada). */
  composicao: { rotulo: string; matriz: Matriz3 }[];
  /** Fatores escalares exibidos no painel (`θ, cos θ, sin θ`, `sx, sy`, `tx, ty`...). Opcional. */
  fatores?: Record<string, Valor>;
  /** Pivô (ponto fixo) da transformação, desenhado sobre a grade. Opcional. */
  pivo?: Ponto;
}

export interface ResultadoTransformacao {
  /** Cópias transformadas dos objetos (mesmos ids). */
  objetos: ObjetoGrafico[];
  /** Pixels dos objetos transformados, já rasterizados. */
  pixels: Pixel[];
}

export const CODIGO_TRANSFORMACAO = [
  'M = produto dos fatores',
  'para cada objeto selecionado faça',
  '  para cada vértice P = (x, y, 1) faça',
  "    x' = m11·x + m12·y + m13",
  "    y' = m21·x + m22·y + m23",
  "    P' = (x', y', 1)",
  '  fim-para',
  "  rasterizar(objeto')",
  'fim-para',
].join('\n');

/** Número limpo para exibição (sem ruído de ponto flutuante e sem −0). */
function limpo(v: number): number {
  const r = arredondar(quaseInteiro(v), 4);
  return r === 0 ? 0 : r;
}

function fmtPonto(p: Ponto): string {
  return `(${formatarNumero(p.x)}, ${formatarNumero(p.y)})`;
}

/** `a·b` com parênteses em fatores negativos, para a descrição do passo. */
function termo(m: number, v: number): string {
  const a = formatarNumero(limpo(m));
  const b = formatarNumero(limpo(v));
  return `${m < 0 ? `(${a})` : a}·${v < 0 ? `(${b})` : b}`;
}

/** Contorno ideal (tracejado) de um objeto, para mostrar a forma original durante a transformação. */
export function contornoObjeto(obj: ObjetoGrafico, cor: string): Overlay[] {
  switch (obj.tipo) {
    case 'ponto':
      return [{ tipo: 'ponto-real', x: obj.p.x, y: obj.p.y, cor }];
    case 'reta':
      return [{ tipo: 'segmento', x1: obj.p1.x, y1: obj.p1.y, x2: obj.p2.x, y2: obj.p2.y, cor, tracejado: true }];
    case 'poligono':
      return [{ tipo: 'poligono-ideal', vertices: obj.vertices.map((v) => ({ ...v })), cor, tracejado: true, fechado: true }];
    case 'circulo':
      return [{ tipo: 'circulo-ideal', xc: obj.centro.x, yc: obj.centro.y, r: obj.raio, cor, tracejado: true }];
    case 'preenchimento':
      return [];
  }
}

/** Escala uniforme (sem distorção): as colunas de M têm o mesmo comprimento. Mesmo critério de `transformarObjeto`. */
function escalaUniforme(M: Matriz3): boolean {
  return Math.abs(Math.hypot(M[0][0], M[1][0]) - Math.hypot(M[0][1], M[1][1])) < 1e-9;
}

export const algoritmoTransformacao: Algoritmo<ParametrosTransformacao, ResultadoTransformacao> = {
  id: 'transformacao',
  nome: 'Transformações 2D',
  codigo: CODIGO_TRANSFORMACAO,

  *executar({ objetos, matriz: M, composicao, fatores = {}, pivo }: ParametrosTransformacao): Generator<Passo, ResultadoTransformacao, void> {
    const resultado: ObjetoGrafico[] = [];
    const pixels: Pixel[] = [];

    // Variáveis fixas da execução: M, cada fator da composição e os fatores escalares.
    const v: Variaveis = { M: paraValor(M, 'M') };
    for (const f of composicao) v[f.rotulo] = paraValor(f.matriz, f.rotulo);
    for (const [nome, valor] of Object.entries(fatores)) v[nome] = valor;
    const snap = (): Variaveis => ({ ...v });

    // Formas originais tracejadas ficam visíveis o tempo todo; o pivô também, quando informado.
    const originais: Overlay[] = objetos.flatMap((o) => contornoObjeto(o, COR_OVERLAY.ideal));
    if (pivo) originais.push({ tipo: 'ponto-real', x: pivo.x, y: pivo.y, cor: COR_OVERLAY.selecao, rotulo: 'pivô' });

    const expressao = composicao.map((f) => f.rotulo).join(' · ');

    // Linha 1: M = produto dos fatores
    yield passo(1, snap(), {
      overlays: originais,
      descricao:
        composicao.length > 1
          ? `M = ${expressao} (a matriz da direita é aplicada primeiro)`
          : `M = ${expressao || 'identidade'}`,
    });

    for (const obj of objetos) {
      v.objeto = obj.nome || obj.tipo;
      delete v.P;
      delete v["x'"];
      delete v["y'"];
      delete v["P'"];

      // Linha 2: próximo objeto
      const vertices = verticesDe(obj);
      yield passo(2, snap(), {
        overlays: [...originais, ...contornoObjeto(obj, COR_OVERLAY.destaque)],
        descricao: `Objeto ${v.objeto}: ${vertices.length} vértice(s) a transformar`,
      });

      // Circunferência sob escala não uniforme viraria elipse: não é representável; pula o objeto.
      if (obj.tipo === 'circulo' && !escalaUniforme(M)) {
        const px = rasterizarObjeto(obj);
        pixels.push(...px);
        resultado.push(obj);
        yield passo(8, snap(), {
          pixels: px,
          overlays: originais,
          descricao: `Aviso: a escala não uniforme transformaria a circunferência ${v.objeto} em elipse; objeto ignorado (mantido como está)`,
        });
        continue;
      }

      const transformados: Ponto[] = [];
      for (let i = 0; i < vertices.length; i++) {
        const P = vertices[i];
        const rotuloP = vertices.length > 1 ? `P${i + 1}` : 'P';
        const parcial: Overlay[] = transformados.map((q, j) => ({
          tipo: 'ponto-real',
          x: q.x,
          y: q.y,
          cor: obj.cor,
          rotulo: vertices.length > 1 ? `P${j + 1}'` : "P'",
        }));
        const marcaP: Overlay = { tipo: 'ponto-real', x: P.x, y: P.y, cor: COR_OVERLAY.destaque, rotulo: rotuloP };

        // Linha 3: vértice em coordenadas homogêneas
        v.P = pontoParaValor(P, 'P');
        delete v["x'"];
        delete v["y'"];
        delete v["P'"];
        yield passo(3, snap(), {
          overlays: [...originais, ...parcial, marcaP],
          descricao: `Vértice ${rotuloP} = (${formatarNumero(limpo(P.x))}, ${formatarNumero(limpo(P.y))}, 1)`,
        });

        const Pl = aplicarPonto(M, P);

        // Linha 4: x'
        v["x'"] = limpo(Pl.x);
        yield passo(4, snap(), {
          overlays: [...originais, ...parcial, marcaP],
          descricao: `x' = ${termo(M[0][0], P.x)} + ${termo(M[0][1], P.y)} + ${formatarNumero(limpo(M[0][2]))} = ${formatarNumero(limpo(Pl.x))}`,
        });

        // Linha 5: y'
        v["y'"] = limpo(Pl.y);
        yield passo(5, snap(), {
          overlays: [...originais, ...parcial, marcaP],
          descricao: `y' = ${termo(M[1][0], P.x)} + ${termo(M[1][1], P.y)} + ${formatarNumero(limpo(M[1][2]))} = ${formatarNumero(limpo(Pl.y))}`,
        });

        // Linha 6: P' — seta do vértice original para o transformado
        v["P'"] = pontoParaValor(Pl, "P'");
        transformados.push(Pl);
        yield passo(6, snap(), {
          overlays: [
            ...originais,
            ...parcial,
            marcaP,
            { tipo: 'seta', de: { ...P }, para: { ...Pl }, cor: COR_OVERLAY.destaque },
            { tipo: 'ponto-real', x: Pl.x, y: Pl.y, cor: obj.cor, rotulo: `${rotuloP}'` },
          ],
          descricao: `${rotuloP}' = ${fmtPonto({ x: limpo(Pl.x), y: limpo(Pl.y) })}`,
        });
      }

      // Linha 8: rasteriza o objeto com os vértices transformados
      const novo = transformarObjeto(obj, M);
      const px = rasterizarObjeto(novo);
      pixels.push(...px);
      resultado.push(novo);
      yield passo(8, snap(), {
        pixels: px,
        overlays: originais,
        descricao: `Rasteriza ${v.objeto} transformado: ${px.length} pixel(s)`,
      });
    }

    return { objetos: resultado, pixels };
  },
};
