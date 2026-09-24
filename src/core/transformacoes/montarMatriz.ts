/**
 * Monta a matriz homogênea de uma transformação 2D a partir dos fatores informados pelo usuário
 * e do pivô (ponto fixo) — slides "CG 02 Transf 2D", "Composição de Transformações".
 *
 * Rotação, escala e reflexão são definidas em relação à ORIGEM. Para fazê-las em torno de um
 * pivô p qualquer, os slides compõem três matrizes:
 *
 *     M = T(p) · X · T(−p)
 *
 * Como P' = M · P (vetor coluna), a matriz mais à direita é aplicada primeiro: T(−p) leva o pivô
 * para a origem, X faz a transformação básica e T(p) devolve o pivô ao lugar. Com o pivô na
 * origem os dois T são a identidade e a composição fica só com X.
 *
 * A translação não tem ponto fixo: o pivô é ignorado e M = T(tx, ty).
 */
import type { Matriz3, Ponto, Valor } from '../tipos';
import { arredondar, formatarNumero, quaseInteiro } from '../geometria';
import { compor, escala, reflexaoX, reflexaoXY, reflexaoY, rotacao, translacao } from '../matriz';

export type EixoReflexao = 'x' | 'y' | 'xy';

/** Transformação básica escolhida na interface, com os fatores informados pelo usuário. */
export type Transformacao =
  | { tipo: 'translacao'; tx: number; ty: number }
  /** Ângulo em graus, sentido anti-horário. */
  | { tipo: 'rotacao'; angulo: number }
  | { tipo: 'escala'; sx: number; sy: number }
  /** 'x' = em torno do eixo X (y → −y); 'y' = eixo Y (x → −x); 'xy' = em relação à origem. */
  | { tipo: 'reflexao'; eixo: EixoReflexao };

export type TipoTransformacao = Transformacao['tipo'];

export interface FatorComposicao {
  /** Rótulo exibido, ex.: "T(3, 2)", "R(90°)", "S(2, 2)", "Ref(X)". */
  rotulo: string;
  matriz: Matriz3;
}

export interface MatrizMontada {
  /** Produto de `composicao`, na ordem em que aparece. */
  matriz: Matriz3;
  /** Fatores na ordem de multiplicação (o último é o primeiro aplicado ao ponto). */
  composicao: FatorComposicao[];
  /** Fatores escalares para o painel de variáveis: `θ, cos θ, sin θ` ou `sx, sy` ou `tx, ty`. */
  fatores: Record<string, Valor>;
  /** Texto da composição, ex.: "T(3, 2) · R(90°) · T(-3, -2)". */
  expressao: string;
}

/** Número limpo para exibição (sem ruído de ponto flutuante e sem −0). */
function limpo(v: number): number {
  const r = arredondar(quaseInteiro(v), 4);
  return r === 0 ? 0 : r;
}

/** Nome da matriz básica (sem pivô) e a própria matriz. */
function basica(t: Transformacao): FatorComposicao {
  switch (t.tipo) {
    case 'translacao':
      return { rotulo: `T(${formatarNumero(t.tx)}, ${formatarNumero(t.ty)})`, matriz: translacao(t.tx, t.ty) };
    case 'rotacao':
      return { rotulo: `R(${formatarNumero(t.angulo)}°)`, matriz: rotacao(t.angulo) };
    case 'escala':
      return { rotulo: `S(${formatarNumero(t.sx)}, ${formatarNumero(t.sy)})`, matriz: escala(t.sx, t.sy) };
    case 'reflexao': {
      const m = t.eixo === 'x' ? reflexaoX() : t.eixo === 'y' ? reflexaoY() : reflexaoXY();
      return { rotulo: `Ref(${t.eixo.toUpperCase()})`, matriz: m };
    }
  }
}

/** Fatores escalares exibidos no painel "Variáveis". */
function fatoresDe(t: Transformacao): Record<string, Valor> {
  switch (t.tipo) {
    case 'translacao':
      return { tx: t.tx, ty: t.ty };
    case 'rotacao': {
      const R = rotacao(t.angulo);
      return { θ: `${formatarNumero(t.angulo)}°`, 'cos θ': limpo(R[0][0]), 'sin θ': limpo(R[1][0]) };
    }
    case 'escala':
      return { sx: t.sx, sy: t.sy };
    case 'reflexao':
      return { eixo: t.eixo === 'xy' ? 'XY (origem)' : t.eixo.toUpperCase() };
  }
}

/**
 * Compõe a matriz da transformação `t` em torno de `pivo`.
 * Translação ignora o pivô; pivô na origem dispensa os dois T.
 */
export function montarMatriz(t: Transformacao, pivo: Ponto): MatrizMontada {
  const x = basica(t);
  const usaPivo = t.tipo !== 'translacao' && (pivo.x !== 0 || pivo.y !== 0);

  const composicao: FatorComposicao[] = usaPivo
    ? [
        { rotulo: `T(${formatarNumero(pivo.x)}, ${formatarNumero(pivo.y)})`, matriz: translacao(pivo.x, pivo.y) },
        x,
        { rotulo: `T(${formatarNumero(-pivo.x)}, ${formatarNumero(-pivo.y)})`, matriz: translacao(-pivo.x, -pivo.y) },
      ]
    : [x];

  const fatores = fatoresDe(t);
  if (t.tipo !== 'translacao') fatores['pivô'] = { tipo: 'ponto', x: limpo(pivo.x), y: limpo(pivo.y) };

  return {
    matriz: compor(...composicao.map((f) => f.matriz)),
    composicao,
    fatores,
    expressao: composicao.map((f) => f.rotulo).join(' · '),
  };
}
