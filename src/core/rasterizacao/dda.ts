/**
 * Algoritmo DDA (Digital Differential Analyzer) para rasterização de retas — slides "CG 04 DDA".
 *
 * Ideia dos slides: escolhe-se o eixo de maior variação (|dx| ou |dy|) como eixo de "passos".
 * Nesse eixo a coordenada avança exatamente 1 por iteração e, no outro, avança o incremento
 * fracionário correspondente (dy/passos ou dx/passos). O ponto real (x, y) é arredondado a
 * cada iteração para obter o pixel.
 *
 * Cada `yield` espelha UMA linha da listagem `CODIGO_DDA` (numeração 1-based, feita pela UI).
 */
import { passo, type Algoritmo, type Overlay, type Passo, type Pixel, type Variaveis } from '../tipos';
import { COR_OVERLAY } from '../cores';
import { arredondar, formatarNumero, quaseInteiro, round } from '../geometria';

/** Extremos (inteiros) da reta. */
export interface ParametrosReta {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Resultado comum dos rasterizadores: pixels na ordem em que foram pintados (sem cor). */
export interface ResultadoRasterizacao {
  pixels: Pixel[];
}

export const CODIGO_DDA = [
  'procedimento DDA(x1, y1, x2, y2)',
  '  dx = x2 - x1',
  '  dy = y2 - y1',
  '  se |dx| > |dy| então passos = |dx| senão passos = |dy|',
  '  se passos = 0 então set_pixel(x1, y1); retorna     // P1 = P2',
  '  x_incr = dx / passos',
  '  y_incr = dy / passos',
  '  x = x1;  y = y1',
  '  set_pixel(round(x), round(y))',
  '  para k = 1 até passos faça',
  '    x = x + x_incr',
  '    y = y + y_incr',
  '    set_pixel(round(x), round(y))',
  '  fim-para',
].join('\n');

/**
 * `round(x), round(y)` da listagem. Antes de arredondar remove-se o ruído do acúmulo de ponto
 * flutuante (ex.: 2.4999999999 iria para 2 quando o valor "matemático" é 2.5 → 3).
 */
function pixelDe(x: number, y: number): Pixel {
  return { x: round(arredondar(x, 9)), y: round(arredondar(y, 9)) };
}

export const algoritmoDDA: Algoritmo<ParametrosReta, ResultadoRasterizacao> = {
  id: 'dda',
  nome: 'DDA',
  codigo: CODIGO_DDA,

  *executar({ x1, y1, x2, y2 }: ParametrosReta): Generator<Passo, ResultadoRasterizacao, void> {
    const pixels: Pixel[] = [];
    // Snapshot completo das variáveis a cada passo; as chaves são inseridas na ordem em que o
    // pseudocódigo as define, para o painel "Variáveis" seguir a listagem.
    const v: Variaveis = { x1, y1, x2, y2 };
    const snap = (): Variaveis => ({ ...v });
    // A reta ideal (contínua) fica visível em todos os passos para comparar com os pixels escolhidos.
    const ideal: Overlay = { tipo: 'segmento', x1, y1, x2, y2, cor: COR_OVERLAY.ideal, tracejado: true };

    // Linha 2: dx = x2 - x1
    const dx = x2 - x1;
    v.dx = dx;
    yield passo(2, snap(), { overlays: [ideal], descricao: `Calcula dx = ${x2} - ${x1} = ${dx}` });

    // Linha 3: dy = y2 - y1
    const dy = y2 - y1;
    v.dy = dy;
    yield passo(3, snap(), { overlays: [ideal], descricao: `Calcula dy = ${y2} - ${y1} = ${dy}` });

    // Linha 4: o eixo de maior variação define o número de passos (1 pixel por passo nesse eixo)
    const passos = Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
    v.passos = passos;
    yield passo(4, snap(), {
      overlays: [ideal],
      descricao:
        Math.abs(dx) > Math.abs(dy)
          ? `|dx| > |dy|: passos = |dx| = ${passos} (avança 1 em x por iteração)`
          : `|dx| ≤ |dy|: passos = |dy| = ${passos} (avança 1 em y por iteração)`,
    });

    // Linha 5: caso degenerado P1 = P2 — evita a divisão por zero das linhas 6 e 7
    if (passos === 0) {
      const px: Pixel = { x: x1, y: y1 };
      pixels.push(px);
      yield passo(5, snap(), {
        pixels: [px],
        overlays: [ideal],
        descricao: `P1 = P2: pinta o pixel (${x1}, ${y1}) e encerra`,
      });
      return { pixels };
    }

    // Linha 6: x_incr = dx / passos
    const xIncr = dx / passos;
    v.x_incr = quaseInteiro(xIncr);
    yield passo(6, snap(), {
      overlays: [ideal],
      descricao: `Calcula o incremento em x: ${dx} / ${passos} = ${formatarNumero(xIncr)}`,
    });

    // Linha 7: y_incr = dy / passos
    const yIncr = dy / passos;
    v.y_incr = quaseInteiro(yIncr);
    yield passo(7, snap(), {
      overlays: [ideal],
      descricao: `Calcula o incremento em y: ${dy} / ${passos} = ${formatarNumero(yIncr)}`,
    });

    // Linha 8: começa no primeiro extremo
    let x = x1;
    let y = y1;
    v.x = x;
    v.y = y;
    yield passo(8, snap(), { overlays: [ideal], descricao: `Ponto inicial (x, y) = (${x1}, ${y1})` });

    // Linha 9: pinta P1
    const primeiro = pixelDe(x, y);
    pixels.push(primeiro);
    yield passo(9, snap(), {
      pixels: [primeiro],
      overlays: [
        ideal,
        { tipo: 'celula', x: primeiro.x, y: primeiro.y, cor: COR_OVERLAY.destaque, estilo: 'preenchido' },
      ],
      descricao: `Pinta o pixel (${primeiro.x}, ${primeiro.y})`,
    });

    // Linhas 10-14: uma iteração por passo no eixo de maior variação
    for (let k = 1; k <= passos; k++) {
      v.k = k;
      yield passo(10, snap(), { overlays: [ideal], descricao: `Iteração k = ${k} de ${passos}` });

      // Linha 11: x = x + x_incr
      x += xIncr;
      v.x = quaseInteiro(x);
      yield passo(11, snap(), {
        overlays: [ideal],
        descricao: `x = x + x_incr = ${formatarNumero(x)}`,
      });

      // Linha 12: y = y + y_incr — mostra o ponto real e a célula em que ele será arredondado
      y += yIncr;
      v.y = quaseInteiro(y);
      const alvo = pixelDe(x, y);
      yield passo(12, snap(), {
        overlays: [
          ideal,
          { tipo: 'celula', x: alvo.x, y: alvo.y, cor: COR_OVERLAY.destaque, estilo: 'contorno' },
          { tipo: 'ponto-real', x, y, cor: COR_OVERLAY.destaque, rotulo: `(${formatarNumero(x)}, ${formatarNumero(y)})` },
        ],
        descricao: `y = y + y_incr = ${formatarNumero(y)}; ponto real (${formatarNumero(x)}, ${formatarNumero(y)})`,
      });

      // Linha 13: pinta o pixel arredondado
      pixels.push(alvo);
      yield passo(13, snap(), {
        pixels: [alvo],
        overlays: [ideal],
        descricao: `Pinta o pixel (round(${formatarNumero(x)}), round(${formatarNumero(y)})) = (${alvo.x}, ${alvo.y})`,
      });
    }

    return { pixels };
  },
};
