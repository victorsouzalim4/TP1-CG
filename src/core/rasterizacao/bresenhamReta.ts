/**
 * Algoritmo de Bresenham para retas — slides "CG 05 Bresenham", versão generalizada para todos
 * os octantes.
 *
 * Ideia dos slides: usa só aritmética inteira. Para |m| < 1 a reta avança sempre 1 em x e a
 * variável de decisão `p` (proporcional à distância do ponto ideal ao meio entre os dois pixels
 * candidatos) escolhe entre o pixel E (mesmo y) e o pixel NE (y + 1). Para |m| ≥ 1 trocam-se os
 * papéis de x e y. Os sinais `incrx`/`incry` cobrem as retas que decrescem em x ou em y.
 *
 * Cada `yield` espelha UMA linha da listagem `CODIGO_BRESENHAM_RETA`.
 */
import { passo, type Algoritmo, type Overlay, type Passo, type Pixel, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import type { ParametrosReta, ResultadoRasterizacao } from './dda';

export const CODIGO_BRESENHAM_RETA = [
  'procedimento Bresenham(x1, y1, x2, y2)',
  '  dx = x2 - x1;  dy = y2 - y1',
  '  se dx >= 0 então incrx = 1 senão incrx = -1; dx = -dx',
  '  se dy >= 0 então incry = 1 senão incry = -1; dy = -dy',
  '  x = x1;  y = y1',
  '  colora_pixel(x, y)',
  '  se dy < dx então                      // |m| < 1: avança em x',
  '    p = 2*dy - dx',
  '    const1 = 2*dy;  const2 = 2*(dy - dx)',
  '    para i = 0 até dx-1 faça',
  '      x = x + incrx',
  '      se p < 0 então p = p + const1',
  '      senão y = y + incry;  p = p + const2',
  '      colora_pixel(x, y)',
  '    fim-para',
  '  senão                                 // |m| >= 1: avança em y',
  '    p = 2*dx - dy',
  '    const1 = 2*dx;  const2 = 2*(dx - dy)',
  '    para i = 0 até dy-1 faça',
  '      y = y + incry',
  '      se p < 0 então p = p + const1',
  '      senão x = x + incrx;  p = p + const2',
  '      colora_pixel(x, y)',
  '    fim-para',
  '  fim-se',
].join('\n');

/** Overlay de célula com contorno (atual ou candidata). */
function celula(x: number, y: number, cor: string, rotulo?: string): Overlay {
  return rotulo === undefined
    ? { tipo: 'celula', x, y, cor, estilo: 'contorno' }
    : { tipo: 'celula', x, y, cor, estilo: 'contorno', rotulo };
}

export const algoritmoBresenhamReta: Algoritmo<ParametrosReta, ResultadoRasterizacao> = {
  id: 'bresenham-reta',
  nome: 'Bresenham (reta)',
  codigo: CODIGO_BRESENHAM_RETA,

  *executar({ x1, y1, x2, y2 }: ParametrosReta): Generator<Passo, ResultadoRasterizacao, void> {
    const pixels: Pixel[] = [];
    // Snapshot completo das variáveis, na ordem em que o pseudocódigo as define.
    const v: Variaveis = { x1, y1, x2, y2 };
    const snap = (): Variaveis => ({ ...v });
    // A reta ideal (contínua) fica visível em todos os passos para comparar com os pixels escolhidos.
    const ideal: Overlay = { tipo: 'segmento', x1, y1, x2, y2, cor: COR_OVERLAY.ideal, tracejado: true };
    const pintar = (x: number, y: number): Pixel => {
      const px: Pixel = { x, y };
      pixels.push(px);
      return px;
    };

    // Linha 2: deltas (ainda com sinal)
    let dx = x2 - x1;
    let dy = y2 - y1;
    v.dx = dx;
    v.dy = dy;
    yield passo(2, snap(), { overlays: [ideal], descricao: `dx = ${dx}, dy = ${dy}` });

    // Linha 3: sentido em x; dx passa a ser |dx| para o restante do algoritmo
    let incrx: number;
    if (dx >= 0) {
      incrx = 1;
    } else {
      incrx = -1;
      dx = -dx;
    }
    v.incrx = incrx;
    v.dx = dx;
    yield passo(3, snap(), {
      overlays: [ideal],
      descricao:
        incrx === 1 ? 'dx ≥ 0: a reta cresce em x (incrx = 1)' : `dx < 0: a reta decresce em x (incrx = -1, dx = ${dx})`,
    });

    // Linha 4: sentido em y; dy passa a ser |dy|
    let incry: number;
    if (dy >= 0) {
      incry = 1;
    } else {
      incry = -1;
      dy = -dy;
    }
    v.incry = incry;
    v.dy = dy;
    yield passo(4, snap(), {
      overlays: [ideal],
      descricao:
        incry === 1 ? 'dy ≥ 0: a reta cresce em y (incry = 1)' : `dy < 0: a reta decresce em y (incry = -1, dy = ${dy})`,
    });

    // Linha 5: ponto inicial
    let x = x1;
    let y = y1;
    v.x = x;
    v.y = y;
    yield passo(5, snap(), { overlays: [ideal], descricao: `Ponto inicial (x, y) = (${x1}, ${y1})` });

    // Linha 6: pinta P1
    const primeiro = pintar(x, y);
    yield passo(6, snap(), { pixels: [primeiro], overlays: [ideal], descricao: `Pinta o pixel (${x}, ${y})` });

    if (dy < dx) {
      // Linha 7: |m| < 1 — x é o eixo que avança 1 por iteração
      yield passo(7, snap(), { overlays: [ideal], descricao: `dy < dx (${dy} < ${dx}): |m| < 1, avança em x` });

      // Linha 8: valor inicial da variável de decisão (p0 = 2·dy − dx nos slides)
      let p = 2 * dy - dx;
      v.p = p;
      yield passo(8, snap(), { overlays: [ideal], descricao: `p = 2·dy − dx = ${p}` });

      // Linha 9: incrementos de p pré-calculados (só somas inteiras dentro do laço)
      const const1 = 2 * dy;
      const const2 = 2 * (dy - dx);
      v.const1 = const1;
      v.const2 = const2;
      yield passo(9, snap(), {
        overlays: [ideal],
        descricao: `const1 = 2·dy = ${const1}; const2 = 2·(dy − dx) = ${const2}`,
      });

      for (let i = 0; i < dx; i++) {
        // Linha 10: início da iteração — mostra a célula atual e as duas candidatas E e NE
        v.i = i;
        const candidatos: Overlay[] = [
          celula(x, y, COR_OVERLAY.destaque),
          celula(x + incrx, y, COR_OVERLAY.candidato, 'E'),
          celula(x + incrx, y + incry, COR_OVERLAY.candidato, 'NE'),
        ];
        yield passo(10, snap(), { overlays: [ideal, ...candidatos], descricao: `i = ${i}: candidatos E e NE` });

        // Linha 11: avança em x
        x += incrx;
        v.x = x;
        yield passo(11, snap(), { overlays: [ideal, ...candidatos], descricao: `x = x + incrx = ${x}` });

        if (p < 0) {
          // Linha 12: o ponto ideal está abaixo do meio → fica no mesmo y (E)
          p += const1;
          v.p = p;
          yield passo(12, snap(), {
            overlays: [ideal, ...candidatos],
            descricao: `p < 0: mantém y (ponto E); p = p + const1 = ${p}`,
          });
        } else {
          // Linha 13: o ponto ideal está acima do meio → sobe um pixel (NE)
          y += incry;
          p += const2;
          v.y = y;
          v.p = p;
          yield passo(13, snap(), {
            overlays: [ideal, ...candidatos],
            descricao: `p ≥ 0: incrementa y (ponto NE); p = p + const2 = ${p}`,
          });
        }

        // Linha 14: pinta o pixel escolhido
        const px = pintar(x, y);
        yield passo(14, snap(), { pixels: [px], overlays: [ideal], descricao: `Pinta o pixel (${x}, ${y})` });
      }
    } else {
      // Linha 7 (falso) → linha 16: |m| ≥ 1 — y é o eixo que avança 1 por iteração.
      // O caso P1 = P2 (dx = dy = 0) cai aqui: p = 0 e o laço executa 0 vezes, sobrando só o pixel inicial.
      yield passo(7, snap(), { overlays: [ideal], descricao: `dy ≥ dx (${dy} ≥ ${dx}): |m| ≥ 1, avança em y` });
      yield passo(16, snap(), { overlays: [ideal], descricao: 'Ramo "senão": papéis de x e y trocados' });

      // Linha 17: p0 = 2·dx − dy
      let p = 2 * dx - dy;
      v.p = p;
      yield passo(17, snap(), { overlays: [ideal], descricao: `p = 2·dx − dy = ${p}` });

      // Linha 18
      const const1 = 2 * dx;
      const const2 = 2 * (dx - dy);
      v.const1 = const1;
      v.const2 = const2;
      yield passo(18, snap(), {
        overlays: [ideal],
        descricao: `const1 = 2·dx = ${const1}; const2 = 2·(dx − dy) = ${const2}`,
      });

      for (let i = 0; i < dy; i++) {
        // Linha 19: candidatas N (mesmo x) e NE (x + incrx), espelhando E/NE do outro ramo
        v.i = i;
        const candidatos: Overlay[] = [
          celula(x, y, COR_OVERLAY.destaque),
          celula(x, y + incry, COR_OVERLAY.candidato, 'N'),
          celula(x + incrx, y + incry, COR_OVERLAY.candidato, 'NE'),
        ];
        yield passo(19, snap(), { overlays: [ideal, ...candidatos], descricao: `i = ${i}: candidatos N e NE` });

        // Linha 20: avança em y
        y += incry;
        v.y = y;
        yield passo(20, snap(), { overlays: [ideal, ...candidatos], descricao: `y = y + incry = ${y}` });

        if (p < 0) {
          // Linha 21: mantém x (N)
          p += const1;
          v.p = p;
          yield passo(21, snap(), {
            overlays: [ideal, ...candidatos],
            descricao: `p < 0: mantém x (ponto N); p = p + const1 = ${p}`,
          });
        } else {
          // Linha 22: incrementa x (NE)
          x += incrx;
          p += const2;
          v.x = x;
          v.p = p;
          yield passo(22, snap(), {
            overlays: [ideal, ...candidatos],
            descricao: `p ≥ 0: incrementa x (ponto NE); p = p + const2 = ${p}`,
          });
        }

        // Linha 23
        const px = pintar(x, y);
        yield passo(23, snap(), { pixels: [px], overlays: [ideal], descricao: `Pinta o pixel (${x}, ${y})` });
      }
    }

    return { pixels };
  },
};
