/**
 * Matrizes homogêneas 3x3 para transformações 2D (slides "CG 02 Transf 2D").
 *
 * Convenção: coordenadas homogêneas em vetor COLUNA, P' = M · P com P = [x, y, 1]^T.
 * Consequência: a composição é lida da direita para a esquerda. `compor(T, R, S)` = T · R · S
 * aplica ao ponto primeiro S, depois R e por fim T — exatamente como nos slides, em que a
 * rotação em torno de um pivô é T(pivô) · R(θ) · T(-pivô).
 */
import type { Matriz3, Ponto, Valor } from './tipos';
import { arredondar, quaseInteiro } from './geometria';

/** Matriz identidade (elemento neutro da composição). */
export function identidade(): Matriz3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

/** Produto A · B. A ordem importa: em geral A·B ≠ B·A (ex.: translação e rotação não comutam). */
export function multiplicar(A: Matriz3, B: Matriz3): Matriz3 {
  const R = identidade();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      R[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
    }
  }
  return R;
}

/**
 * Compõe várias matrizes: `compor(M1, M2, ..., Mn)` = M1 · M2 · ... · Mn.
 * Como P' = M · P, a ÚLTIMA matriz da lista é a PRIMEIRA transformação aplicada ao ponto.
 * Sem argumentos devolve a identidade.
 */
export function compor(...ms: Matriz3[]): Matriz3 {
  return ms.reduce((acumulada, m) => multiplicar(acumulada, m), identidade());
}

/** Translação por (tx, ty): [[1, 0, tx], [0, 1, ty], [0, 0, 1]]. */
export function translacao(tx: number, ty: number): Matriz3 {
  return [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1],
  ];
}

/** Escala em relação à origem: [[sx, 0, 0], [0, sy, 0], [0, 0, 1]]. */
export function escala(sx: number, sy: number): Matriz3 {
  return [
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1],
  ];
}

/**
 * Rotação anti-horária de `anguloGraus` em torno da origem:
 * [[cos θ, -sen θ, 0], [sen θ, cos θ, 0], [0, 0, 1]].
 * `quaseInteiro` remove o ruído de ponto flutuante (ex.: cos 90° = 6e-17), para que múltiplos
 * de 90° produzam vértices exatamente inteiros.
 */
export function rotacao(anguloGraus: number): Matriz3 {
  const rad = (anguloGraus * Math.PI) / 180;
  const c = quaseInteiro(Math.cos(rad));
  const s = quaseInteiro(Math.sin(rad));
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/** Reflexão em torno do eixo X: (x, y) → (x, -y), ou seja, diag(1, -1, 1). */
export function reflexaoX(): Matriz3 {
  return escala(1, -1);
}

/** Reflexão em torno do eixo Y: (x, y) → (-x, y), ou seja, diag(-1, 1, 1). */
export function reflexaoY(): Matriz3 {
  return escala(-1, 1);
}

/** Reflexão em relação à origem (eixos X e Y): (x, y) → (-x, -y), ou seja, diag(-1, -1, 1). */
export function reflexaoXY(): Matriz3 {
  return escala(-1, -1);
}

/** Aplica a matriz a um ponto: P' = M · [x, y, 1]^T (a terceira linha é sempre [0, 0, 1]). */
export function aplicarPonto(M: Matriz3, p: Ponto): Ponto {
  return {
    x: M[0][0] * p.x + M[0][1] * p.y + M[0][2],
    y: M[1][0] * p.x + M[1][1] * p.y + M[1][2],
  };
}

/** Normaliza -0 para 0 (aparece em `-sen θ` quando sen θ = 0) e limita a 4 casas para exibição. */
function limparEntrada(v: number): number {
  const limpo = arredondar(quaseInteiro(v), 4);
  return limpo === 0 ? 0 : limpo;
}

/** Converte a matriz para o `Valor` exibido no painel de variáveis. */
export function paraValor(M: Matriz3, rotulo?: string): Valor {
  const linhas = M.map((linha) => linha.map(limparEntrada));
  return rotulo === undefined ? { tipo: 'matriz', linhas } : { tipo: 'matriz', linhas, rotulo };
}

/** Converte um ponto para o vetor coluna homogêneo [x, y, 1]^T exibível no painel de variáveis. */
export function pontoParaValor(p: Ponto, rotulo?: string): Valor {
  const linhas = [[limparEntrada(p.x)], [limparEntrada(p.y)], [1]];
  return rotulo === undefined ? { tipo: 'matriz', linhas } : { tipo: 'matriz', linhas, rotulo };
}
