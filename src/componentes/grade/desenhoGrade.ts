/**
 * Funções puras de desenho da matriz de pixels sobre um canvas 2D.
 *
 * Convenções:
 *  - Coordenadas de célula: origem inferior-esquerda, Y para cima. A célula (0,0) fica deslocada
 *    `origem.x` colunas e `origem.y` linhas do canto inferior-esquerdo da grade, o que permite
 *    colocar a origem no centro (útil para reflexões).
 *  - Coordenadas REAIS (x, y) são mapeadas para o CENTRO da célula correspondente; assim o eixo
 *    x = 0 passa pelo centro da coluna 0, consistente com a reflexão inteira x -> -x.
 *  - Todas as funções recebem o `Viewport` (geometria da grade em pixels CSS) e um contexto já
 *    escalado pelo devicePixelRatio (ver `prepararCanvas`).
 *  - Células e pixels fora dos limites visíveis são ignorados silenciosamente.
 */
import type { Overlay, Pixel, Ponto, Retangulo } from '../../core/tipos';
import { COR_FUNDO, COR_OVERLAY } from '../../core/cores';
import { formatarNumero } from '../../core/geometria';

/** Geometria da grade dentro do canvas (unidades: pixels CSS). */
export interface Viewport {
  /** Número de colunas da grade. */
  largura: number;
  /** Número de linhas da grade. */
  altura: number;
  /** Deslocamento da célula (0,0) em relação ao canto inferior-esquerdo. */
  origem: Ponto;
  /** Lado de cada célula (quadrada), em px. Zero quando não há espaço para desenhar. */
  tamanhoCelula: number;
  /** Distância da borda esquerda do canvas até a borda esquerda da grade (inclui a sobra de centralização). */
  margemEsq: number;
  /** Distância da borda inferior do canvas até a borda inferior da grade (inclui a sobra de centralização). */
  margemInf: number;
  /** Largura total do canvas em px CSS. */
  larguraCss: number;
  /** Altura total do canvas em px CSS. */
  alturaCss: number;
}

/** Retângulo em pixels CSS. */
export interface RectPx {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Margem reservada para os rótulos numéricos (esquerda e inferior). */
export const MARGEM_ROTULOS = 28;
/** Margem superior/direita, para os rótulos "x"/"y" dos eixos e respiro visual. */
export const MARGEM_EXTERNA = 14;

// Cores fixas da grade (não fazem parte da paleta do usuário).
const COR_LINHA_GRADE = '#e2e8f0';
const COR_BORDA_GRADE = '#94a3b8';
const COR_EIXO = '#475569';
const COR_ROTULO = '#64748b';
const COR_TEXTO_OVERLAY = '#0f172a';
const COR_HALO = 'rgba(255, 255, 255, 0.92)';

// O canvas não resolve variáveis CSS: a pilha de fontes é repetida aqui.
const FAMILIA_FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const FONTE_ROTULO = `11px ${FAMILIA_FONTE}`;
const FONTE_ROTULO_NEGRITO = `600 12px ${FAMILIA_FONTE}`;

// ---------------------------------------------------------------------------
// Cálculo do viewport e conversões de coordenadas
// ---------------------------------------------------------------------------

/**
 * Calcula a geometria da grade para um container de `w × h` px CSS.
 * A célula é quadrada: t = floor(min(espaço horizontal / largura, espaço vertical / altura)).
 * A sobra é distribuída igualmente para centralizar a grade na área disponível.
 */
export function calcularViewport(
  container: { w: number; h: number },
  largura: number,
  altura: number,
  origem: Ponto,
): Viewport {
  const larguraCss = Math.max(0, Math.floor(container.w));
  const alturaCss = Math.max(0, Math.floor(container.h));
  const disponivelW = larguraCss - MARGEM_ROTULOS - MARGEM_EXTERNA;
  const disponivelH = alturaCss - MARGEM_ROTULOS - MARGEM_EXTERNA;
  const t =
    largura > 0 && altura > 0 ? Math.floor(Math.min(disponivelW / largura, disponivelH / altura)) : 0;
  const tamanhoCelula = Number.isFinite(t) && t > 0 ? t : 0;
  const sobraX = Math.max(0, disponivelW - tamanhoCelula * largura);
  const sobraY = Math.max(0, disponivelH - tamanhoCelula * altura);
  return {
    largura,
    altura,
    origem: { x: origem.x, y: origem.y },
    tamanhoCelula,
    margemEsq: MARGEM_ROTULOS + Math.floor(sobraX / 2),
    margemInf: MARGEM_ROTULOS + Math.floor(sobraY / 2),
    larguraCss,
    alturaCss,
  };
}

/** Limites inclusivos das coordenadas de célula visíveis. */
export function limitesVisiveis(vp: Viewport): Retangulo {
  return {
    xmin: -vp.origem.x,
    xmax: vp.largura - 1 - vp.origem.x,
    ymin: -vp.origem.y,
    ymax: vp.altura - 1 - vp.origem.y,
  };
}

/** `true` se a célula inteira (x, y) está dentro da grade visível. */
export function dentroDaGrade(vp: Viewport, x: number, y: number): boolean {
  const l = limitesVisiveis(vp);
  return x >= l.xmin && x <= l.xmax && y >= l.ymin && y <= l.ymax;
}

/** Retângulo (px) ocupado pela grade inteira dentro do canvas. */
export function areaGrade(vp: Viewport): RectPx {
  const t = vp.tamanhoCelula;
  return {
    x: vp.margemEsq,
    y: vp.alturaCss - vp.margemInf - vp.altura * t,
    w: vp.largura * t,
    h: vp.altura * t,
  };
}

/** Retângulo (px) da célula inteira (x, y). Não verifica limites. */
export function celulaParaRect(vp: Viewport, x: number, y: number): RectPx {
  const t = vp.tamanhoCelula;
  return {
    x: vp.margemEsq + (x + vp.origem.x) * t,
    y: vp.alturaCss - vp.margemInf - (y + vp.origem.y + 1) * t,
    w: t,
    h: t,
  };
}

/** Posição (px) de uma coordenada real: o centro da célula correspondente. */
export function realParaPx(vp: Viewport, x: number, y: number): Ponto {
  const t = vp.tamanhoCelula;
  return {
    x: vp.margemEsq + (x + vp.origem.x + 0.5) * t,
    y: vp.alturaCss - vp.margemInf - (y + vp.origem.y + 0.5) * t,
  };
}

/** Célula sob a posição (px, py) do canvas, ou `null` fora da grade. */
export function pxParaCelula(vp: Viewport, px: number, py: number): Ponto | null {
  const t = vp.tamanhoCelula;
  if (t <= 0) return null;
  const x = Math.floor((px - vp.margemEsq) / t) - vp.origem.x;
  const y = Math.floor((vp.alturaCss - vp.margemInf - py) / t) - vp.origem.y;
  return dentroDaGrade(vp, x, y) ? { x, y } : null;
}

/** Como `pxParaCelula`, mas limita a célula à grade (usado durante arrastos que saem da área). */
export function pxParaCelulaLimitada(vp: Viewport, px: number, py: number): Ponto | null {
  const t = vp.tamanhoCelula;
  if (t <= 0) return null;
  const l = limitesVisiveis(vp);
  const x = Math.floor((px - vp.margemEsq) / t) - vp.origem.x;
  const y = Math.floor((vp.alturaCss - vp.margemInf - py) / t) - vp.origem.y;
  return {
    x: Math.min(l.xmax, Math.max(l.xmin, x)),
    y: Math.min(l.ymax, Math.max(l.ymin, y)),
  };
}

/**
 * Retângulo (px) que cobre as células inclusivas de `ret`, recortado aos limites visíveis.
 * Devolve `null` quando nada é visível.
 */
export function retanguloParaPx(vp: Viewport, ret: Retangulo): RectPx | null {
  if (vp.tamanhoCelula <= 0) return null;
  const l = limitesVisiveis(vp);
  const xmin = Math.max(Math.round(ret.xmin), l.xmin);
  const xmax = Math.min(Math.round(ret.xmax), l.xmax);
  const ymin = Math.max(Math.round(ret.ymin), l.ymin);
  const ymax = Math.min(Math.round(ret.ymax), l.ymax);
  if (xmin > xmax || ymin > ymax) return null;
  const cantoSupEsq = celulaParaRect(vp, xmin, ymax);
  const cantoInfDir = celulaParaRect(vp, xmax, ymin);
  return {
    x: cantoSupEsq.x,
    y: cantoSupEsq.y,
    w: cantoInfDir.x + cantoInfDir.w - cantoSupEsq.x,
    h: cantoInfDir.y + cantoInfDir.h - cantoSupEsq.y,
  };
}

// ---------------------------------------------------------------------------
// Preparação do canvas (DPR)
// ---------------------------------------------------------------------------

/**
 * Ajusta as dimensões físicas do canvas ao devicePixelRatio, aplica a escala e limpa a área.
 * Devolve o contexto pronto para desenhar em px CSS (ou `null` se o canvas não suportar 2D).
 */
export function prepararCanvas(canvas: HTMLCanvasElement, vp: Viewport): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(vp.larguraCss * dpr));
  const h = Math.max(1, Math.round(vp.alturaCss * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const larguraEstilo = `${vp.larguraCss}px`;
  const alturaEstilo = `${vp.alturaCss}px`;
  if (canvas.style.width !== larguraEstilo) canvas.style.width = larguraEstilo;
  if (canvas.style.height !== alturaEstilo) canvas.style.height = alturaEstilo;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vp.larguraCss, vp.alturaCss);
  return ctx;
}

// ---------------------------------------------------------------------------
// Primitivas auxiliares
// ---------------------------------------------------------------------------

/** Espessura de linha proporcional ao tamanho da célula, limitada a [1.5, 3]. */
function larguraLinha(t: number): number {
  return Math.max(1.5, Math.min(3, t * 0.12));
}

/** Texto com halo branco, legível sobre a grade e sobre pixels pintados. */
function desenharRotulo(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  cor: string,
  alinhamento: CanvasTextAlign,
  base: CanvasTextBaseline,
  negrito = false,
): void {
  ctx.save();
  ctx.font = negrito ? FONTE_ROTULO_NEGRITO : FONTE_ROTULO;
  ctx.textAlign = alinhamento;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = COR_HALO;
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = cor;
  ctx.fillText(texto, x, y);
  ctx.restore();
}

/** Segmento de reta entre dois pontos em px. */
function desenharLinha(
  ctx: CanvasRenderingContext2D,
  a: Ponto,
  b: Ponto,
  cor: string,
  espessura: number,
  tracejado: boolean,
  opacidade = 1,
): void {
  ctx.save();
  ctx.globalAlpha = opacidade;
  ctx.strokeStyle = cor;
  ctx.lineWidth = espessura;
  ctx.lineCap = 'round';
  if (tracejado) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

/** Seta de `a` até `b` (px) com ponta triangular preenchida terminando exatamente em `b`. */
function desenharSetaPx(ctx: CanvasRenderingContext2D, a: Ponto, b: Ponto, cor: string, t: number): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento = Math.hypot(dx, dy);
  if (comprimento < 1) return;
  const ux = dx / comprimento;
  const uy = dy / comprimento;
  const cabeca = Math.max(8, Math.min(14, t * 0.5));
  const meiaLargura = cabeca * 0.45;
  // A linha termina um pouco antes da ponta para não "vazar" além do triângulo.
  const fimLinha = { x: b.x - ux * cabeca * 0.7, y: b.y - uy * cabeca * 0.7 };
  desenharLinha(ctx, a, fimLinha, cor, 2, false);
  ctx.save();
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - ux * cabeca - uy * meiaLargura, b.y - uy * cabeca + ux * meiaLargura);
  ctx.lineTo(b.x - ux * cabeca + uy * meiaLargura, b.y - uy * cabeca - ux * meiaLargura);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Camada estática: grade, eixos e rótulos
// ---------------------------------------------------------------------------

/**
 * Desenha o fundo, as linhas da grade, os eixos (x = 0 e y = 0, quando visíveis) e os rótulos
 * numéricos nas margens. Rótulos em todas as células quando t >= 12 px; a cada 5 quando menor
 * (a cada 10 quando t < 6 px).
 */
export function desenharGrade(vp: Viewport, ctx: CanvasRenderingContext2D, mostrarEixos = true): void {
  const t = vp.tamanhoCelula;
  if (t <= 0) return;
  const area = areaGrade(vp);
  const lim = limitesVisiveis(vp);

  // Fundo das células.
  ctx.fillStyle = COR_FUNDO;
  ctx.fillRect(area.x, area.y, area.w, area.h);

  // Linhas internas (omitidas quando as células são minúsculas para não virar um borrão).
  if (t >= 4) {
    ctx.strokeStyle = COR_LINHA_GRADE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < vp.largura; i++) {
      const x = area.x + i * t + 0.5;
      ctx.moveTo(x, area.y);
      ctx.lineTo(x, area.y + area.h);
    }
    for (let j = 1; j < vp.altura; j++) {
      const y = area.y + j * t + 0.5;
      ctx.moveTo(area.x, y);
      ctx.lineTo(area.x + area.w, y);
    }
    ctx.stroke();
  }

  // Borda externa.
  ctx.strokeStyle = COR_BORDA_GRADE;
  ctx.lineWidth = 1;
  ctx.strokeRect(area.x + 0.5, area.y + 0.5, area.w, area.h);

  // Eixos passando pelo centro da coluna 0 e da linha 0.
  if (mostrarEixos) {
    const eixoYVisivel = 0 >= lim.xmin && 0 <= lim.xmax;
    const eixoXVisivel = 0 >= lim.ymin && 0 <= lim.ymax;
    const centroOrigem = realParaPx(vp, 0, 0);
    ctx.save();
    ctx.strokeStyle = COR_EIXO;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.75;
    if (eixoYVisivel) {
      ctx.beginPath();
      ctx.moveTo(centroOrigem.x, area.y);
      ctx.lineTo(centroOrigem.x, area.y + area.h);
      ctx.stroke();
    }
    if (eixoXVisivel) {
      ctx.beginPath();
      ctx.moveTo(area.x, centroOrigem.y);
      ctx.lineTo(area.x + area.w, centroOrigem.y);
      ctx.stroke();
    }
    ctx.restore();
    // Nomes dos eixos nas margens superior/direita.
    ctx.fillStyle = COR_EIXO;
    ctx.font = FONTE_ROTULO_NEGRITO;
    if (eixoYVisivel) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('y', centroOrigem.x, area.y - 2);
    }
    if (eixoXVisivel) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', area.x + area.w + 3, centroOrigem.y);
    }
  }

  // Rótulos numéricos.
  const passoRotulo = t >= 12 ? 1 : t >= 6 ? 5 : 10;
  ctx.fillStyle = COR_ROTULO;
  ctx.font = FONTE_ROTULO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = lim.xmin; x <= lim.xmax; x++) {
    if (x % passoRotulo !== 0) continue;
    ctx.fillText(String(x), realParaPx(vp, x, 0).x, area.y + area.h + 4);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = lim.ymin; y <= lim.ymax; y++) {
    if (y % passoRotulo !== 0) continue;
    ctx.fillText(String(y), area.x - 5, realParaPx(vp, 0, y).y);
  }
}

// ---------------------------------------------------------------------------
// Pixels
// ---------------------------------------------------------------------------

/**
 * Pinta cada pixel na sua célula (coordenadas não inteiras são arredondadas).
 * Mantém 1 px de folga à esquerda/acima para que as linhas da grade continuem visíveis.
 */
export function desenharPixels(vp: Viewport, ctx: CanvasRenderingContext2D, pixels: readonly Pixel[], corPadrao: string): void {
  const t = vp.tamanhoCelula;
  if (t <= 0) return;
  const folga = t >= 4 ? 1 : 0;
  for (const p of pixels) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (!dentroDaGrade(vp, x, y)) continue;
    const r = celulaParaRect(vp, x, y);
    ctx.fillStyle = p.cor ?? corPadrao;
    ctx.fillRect(r.x + folga, r.y + folga, r.w - folga, r.h - folga);
  }
}

/** Contorno colorido em cada célula (usado para destacar os pixels dos objetos selecionados). */
export function desenharContornoCelulas(vp: Viewport, ctx: CanvasRenderingContext2D, pixels: readonly Pixel[], cor: string): void {
  const t = vp.tamanhoCelula;
  if (t <= 0) return;
  const espessura = t >= 6 ? 2 : 1;
  const recuo = espessura / 2 + (t >= 4 ? 1 : 0);
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = espessura;
  for (const p of pixels) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (!dentroDaGrade(vp, x, y)) continue;
    const r = celulaParaRect(vp, x, y);
    ctx.strokeRect(r.x + recuo, r.y + recuo, r.w - 2 * recuo + 1, r.h - 2 * recuo + 1);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Retângulos (seleção, janela de recorte e overlay 'retangulo')
// ---------------------------------------------------------------------------

/**
 * Contorno (e leve preenchimento translúcido) do retângulo de células `ret`.
 * `rotulo` é escrito acima do canto superior-esquerdo.
 */
export function desenharRetangulo(
  vp: Viewport,
  ctx: CanvasRenderingContext2D,
  ret: Retangulo,
  cor: string,
  tracejado = false,
  rotulo?: string,
): void {
  const r = retanguloParaPx(vp, ret);
  if (!r) return;
  ctx.save();
  ctx.fillStyle = cor;
  ctx.globalAlpha = 0.07;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  if (tracejado) ctx.setLineDash([6, 4]);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 1, r.h - 1);
  ctx.restore();
  if (rotulo) desenharRotulo(ctx, rotulo, r.x + 2, r.y - 3, cor, 'left', 'bottom', true);
}

/** Realce da célula sob o ponteiro. */
export function desenharHover(vp: Viewport, ctx: CanvasRenderingContext2D, p: Ponto): void {
  if (vp.tamanhoCelula <= 0 || !dentroDaGrade(vp, p.x, p.y)) return;
  const r = celulaParaRect(vp, p.x, p.y);
  ctx.save();
  ctx.fillStyle = COR_OVERLAY.selecao;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COR_OVERLAY.selecao;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Overlays (anotações de um passo do algoritmo)
// ---------------------------------------------------------------------------

/**
 * Desenha todos os overlays de um passo. As formas são recortadas à área da grade; os rótulos
 * de texto são desenhados depois, sem recorte, para continuarem legíveis nas bordas.
 */
export function desenharOverlays(vp: Viewport, ctx: CanvasRenderingContext2D, overlays: readonly Overlay[]): void {
  const t = vp.tamanhoCelula;
  if (t <= 0 || overlays.length === 0) return;
  const area = areaGrade(vp);
  const rotulosPendentes: Array<() => void> = [];

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();

  for (const o of overlays) {
    switch (o.tipo) {
      case 'celula': {
        if (!dentroDaGrade(vp, o.x, o.y)) break;
        const r = celulaParaRect(vp, o.x, o.y);
        ctx.save();
        if (o.estilo === 'preenchido') {
          const folga = t >= 4 ? 1 : 0;
          ctx.fillStyle = o.cor;
          ctx.fillRect(r.x + folga, r.y + folga, r.w - folga, r.h - folga);
        } else {
          const espessura = t >= 6 ? 2 : 1;
          const recuo = espessura / 2 + (t >= 4 ? 1 : 0);
          ctx.strokeStyle = o.cor;
          ctx.lineWidth = espessura;
          ctx.strokeRect(r.x + recuo, r.y + recuo, r.w - 2 * recuo + 1, r.h - 2 * recuo + 1);
        }
        ctx.restore();
        const rotulo = o.rotulo;
        if (rotulo) {
          rotulosPendentes.push(() => desenharRotulo(ctx, rotulo, r.x + r.w / 2, r.y - 2, o.cor, 'center', 'bottom'));
        }
        break;
      }
      case 'ponto-real': {
        const c = realParaPx(vp, o.x, o.y);
        const raio = Math.max(3, Math.min(6, t * 0.22));
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, raio, 0, Math.PI * 2);
        ctx.fillStyle = o.cor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
        const rotulo = o.rotulo;
        if (rotulo) {
          rotulosPendentes.push(() => desenharRotulo(ctx, rotulo, c.x + raio + 3, c.y, o.cor, 'left', 'middle'));
        }
        break;
      }
      case 'segmento': {
        desenharLinha(
          ctx,
          realParaPx(vp, o.x1, o.y1),
          realParaPx(vp, o.x2, o.y2),
          o.cor,
          larguraLinha(t),
          o.tracejado ?? false,
          o.opacidade ?? 1,
        );
        break;
      }
      case 'retangulo': {
        desenharRetangulo(vp, ctx, o.ret, o.cor, o.tracejado ?? false);
        const rotulo = o.rotulo;
        const r = retanguloParaPx(vp, o.ret);
        if (rotulo && r) {
          rotulosPendentes.push(() => desenharRotulo(ctx, rotulo, r.x + 2, r.y - 3, o.cor, 'left', 'bottom', true));
        }
        break;
      }
      case 'circulo-ideal': {
        const c = realParaPx(vp, o.xc, o.yc);
        ctx.save();
        ctx.strokeStyle = o.cor;
        ctx.lineWidth = 1.5;
        if (o.tracejado) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(0, o.r) * t, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'poligono-ideal': {
        if (o.vertices.length === 0) break;
        ctx.save();
        ctx.strokeStyle = o.cor;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        if (o.tracejado) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        o.vertices.forEach((v, i) => {
          const c = realParaPx(vp, v.x, v.y);
          if (i === 0) ctx.moveTo(c.x, c.y);
          else ctx.lineTo(c.x, c.y);
        });
        if (o.fechado && o.vertices.length > 2) ctx.closePath();
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'texto': {
        const c = realParaPx(vp, o.x, o.y);
        const cor = o.cor ?? COR_TEXTO_OVERLAY;
        rotulosPendentes.push(() => desenharRotulo(ctx, o.texto, c.x, c.y, cor, 'center', 'middle', true));
        break;
      }
      case 'seta': {
        desenharSetaPx(ctx, realParaPx(vp, o.de.x, o.de.y), realParaPx(vp, o.para.x, o.para.y), o.cor, t);
        break;
      }
    }
  }

  ctx.restore();
  for (const desenhar of rotulosPendentes) desenhar();
}

/** Texto curto "(x, y)" para rótulos e barra de status. */
export function formatarPonto(p: Ponto): string {
  return `(${formatarNumero(p.x)}, ${formatarNumero(p.y)})`;
}
