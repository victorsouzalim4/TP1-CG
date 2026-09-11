/**
 * Matriz de pixels lógica: a "memória de vídeo" do simulador.
 *
 * Só as células pintadas ficam guardadas (Map chaveado por "x,y"); as demais têm a cor de fundo.
 * É a estrutura que os algoritmos de preenchimento consultam (`inquirir_cor`) e alteram (`set_pixel`),
 * como nos slides "CG 08 Preenchimento". Fora dos limites `inquirirCor` devolve `COR_FORA`, que
 * funciona como uma "parede" natural para o Boundary Fill e o Flood Fill.
 */
import type { Pixel, Retangulo } from './tipos';
import { COR_FORA, COR_FUNDO, COR_PADRAO } from './cores';

export class MatrizPixels {
  private readonly cores = new Map<string, string>();
  private readonly _limites: Retangulo;
  private readonly corFundo: string;

  constructor(limites: Retangulo, corFundo = COR_FUNDO) {
    this._limites = { ...limites };
    this.corFundo = corFundo;
  }

  /** Constrói a matriz a partir dos pixels da cena; pixels sem cor recebem `corPadrao`. */
  static deCena(pixels: Pixel[], limites: Retangulo, corPadrao = COR_PADRAO): MatrizPixels {
    const m = new MatrizPixels(limites);
    for (const px of pixels) m.setPixel(px.x, px.y, px.cor ?? corPadrao);
    return m;
  }

  private static chave(x: number, y: number): string {
    return `${x},${y}`;
  }

  get limites(): Retangulo {
    return this._limites;
  }

  /** Quantidade de células pintadas. */
  get quantidade(): number {
    return this.cores.size;
  }

  /** Verifica se (x, y) está dentro da grade (limites inclusivos). */
  dentro(x: number, y: number): boolean {
    const l = this._limites;
    return x >= l.xmin && x <= l.xmax && y >= l.ymin && y <= l.ymax;
  }

  /** `inquirir_cor(x, y)` dos slides: cor da célula, fundo se não pintada, `COR_FORA` fora da grade. */
  inquirirCor(x: number, y: number): string {
    if (!this.dentro(x, y)) return COR_FORA;
    return this.cores.get(MatrizPixels.chave(x, y)) ?? this.corFundo;
  }

  /** `set_pixel(x, y, cor)` dos slides; pedidos fora da grade são ignorados silenciosamente. */
  setPixel(x: number, y: number, cor: string): void {
    if (!this.dentro(x, y)) return;
    this.cores.set(MatrizPixels.chave(x, y), cor);
  }

  /** Cópia independente (os algoritmos de preenchimento trabalham sobre uma cópia da cena). */
  clonar(): MatrizPixels {
    const copia = new MatrizPixels(this._limites, this.corFundo);
    for (const [k, cor] of this.cores) copia.cores.set(k, cor);
    return copia;
  }

  /** Lista das células pintadas, com cor (ordem de inserção). */
  pixels(): Pixel[] {
    const lista: Pixel[] = [];
    for (const [k, cor] of this.cores) {
      const [x, y] = k.split(',').map(Number);
      lista.push({ x, y, cor });
    }
    return lista;
  }
}
