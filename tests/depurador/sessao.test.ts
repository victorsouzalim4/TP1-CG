import { describe, expect, it } from 'vitest';
import { criarSessao, montarQuadro } from '../../src/depurador/sessao';
import { algoritmoDDA } from '../../src/core/rasterizacao/dda';
import { algoritmoBresenhamReta } from '../../src/core/rasterizacao/bresenhamReta';
import { algoritmoCohenSutherland } from '../../src/core/recorte/cohenSutherland';

const COR = '#dc2626';

describe('sessão de depuração', () => {
  const sessao = criarSessao(algoritmoDDA, { x1: 0, y1: 0, x2: 6, y2: 2 }, { corPadrao: COR });

  it('fimPixels é monótono e termina no total de pixels', () => {
    for (let i = 1; i < sessao.fimPixels.length; i++) {
      expect(sessao.fimPixels[i]).toBeGreaterThanOrEqual(sessao.fimPixels[i - 1]);
    }
    expect(sessao.fimPixels).toHaveLength(sessao.passos.length);
    expect(sessao.fimPixels[sessao.fimPixels.length - 1]).toBe(sessao.todosPixels.length);
    expect(sessao.todosPixels).toHaveLength(7);
    expect(sessao.truncado).toBe(false);
    expect(sessao.passosOmitidos).toBe(0);
  });

  it('pixels sem cor recebem a cor padrão', () => {
    expect(sessao.todosPixels.every((p) => p.cor === COR)).toBe(true);
  });

  it('montarQuadro(i).pixels.length === fimPixels[i]', () => {
    for (let i = 0; i < sessao.passos.length; i++) {
      const q = montarQuadro(sessao, i);
      expect(q.pixels).toHaveLength(sessao.fimPixels[i]);
      expect(q.indice).toBe(i);
      expect(q.linha).toBe(sessao.passos[i].linha);
    }
  });

  it('quadro -1 é vazio', () => {
    const q = montarQuadro(sessao, -1);
    expect(q.indice).toBe(-1);
    expect(q.linha).toBeNull();
    expect(q.pixels).toEqual([]);
    expect(q.overlays).toEqual([]);
    expect(q.variaveis).toEqual({});
    expect(q.concluido).toBe(false);
  });

  it('índice acima do total é limitado ao último passo', () => {
    const q = montarQuadro(sessao, 10_000);
    expect(q.indice).toBe(sessao.passos.length - 1);
    expect(q.concluido).toBe(true);
  });

  it('concluido só no último passo', () => {
    const concluidos = sessao.passos.map((_, i) => montarQuadro(sessao, i).concluido);
    expect(concluidos.filter(Boolean)).toHaveLength(1);
    expect(concluidos[concluidos.length - 1]).toBe(true);
  });

  it('variaveisAlteradas compara com o passo anterior', () => {
    // Passo 0 (linha 2): tudo é novo. Passo 1 (linha 3): só dy. Passo 2 (linha 4): só passos.
    expect([...montarQuadro(sessao, 0).variaveisAlteradas]).toEqual(['x1', 'y1', 'x2', 'y2', 'dx']);
    expect([...montarQuadro(sessao, 1).variaveisAlteradas]).toEqual(['dy']);
    expect([...montarQuadro(sessao, 2).variaveisAlteradas]).toEqual(['passos']);
    // Linha 8 define x e y; linha 9 (pinta P1) não altera nada.
    const linha9 = sessao.passos.findIndex((p) => p.linha === 9);
    expect(montarQuadro(sessao, linha9).variaveisAlteradas.size).toBe(0);
  });

  it('maxPassos trunca e o último quadro contém todos os pixels', () => {
    const longa = criarSessao(algoritmoDDA, { x1: 0, y1: 0, x2: 30, y2: 0 }, { corPadrao: COR, maxPassos: 10 });
    expect(longa.truncado).toBe(true);
    expect(longa.passos).toHaveLength(11); // 10 reais + 1 sintético
    expect(longa.passosOmitidos).toBeGreaterThan(0);
    expect(longa.todosPixels).toHaveLength(31);
    const ultimo = montarQuadro(longa, longa.passos.length - 1);
    expect(ultimo.pixels).toHaveLength(31);
    expect(ultimo.concluido).toBe(true);
    expect(ultimo.descricao).toContain('omitidos');
    // O passo sintético herda linha e variáveis do último passo real (set_pixel da última iteração).
    expect(ultimo.linha).toBe(13);
    expect(ultimo.variaveis.k).toBe(30);
    expect(ultimo.variaveis.x).toBe(30);
    // O 10º passo (índice 9) ainda tem só os pixels emitidos até ali.
    expect(montarQuadro(longa, 9).pixels.length).toBe(longa.fimPixels[9]);
    expect(longa.fimPixels[9]).toBeLessThan(31);
  });

  it('guarda metadados do algoritmo e o resultado', () => {
    const s = criarSessao(algoritmoBresenhamReta, { x1: 0, y1: 0, x2: 3, y2: 1 }, { corPadrao: COR });
    expect(s.algoritmoId).toBe('bresenham-reta');
    expect(s.nome).toBe(algoritmoBresenhamReta.nome);
    expect(s.codigo).toBe(algoritmoBresenhamReta.codigo);
    expect((s.resultado as { pixels: unknown[] }).pixels).toHaveLength(4);
  });

  it('propaga erros do algoritmo (stub não implementado)', () => {
    expect(() =>
      criarSessao(
        algoritmoCohenSutherland,
        { x1: 0, y1: 0, x2: 1, y2: 1, janela: { xmin: 0, ymin: 0, xmax: 5, ymax: 5 } },
        { corPadrao: COR },
      ),
    ).toThrow('não implementado');
  });
});
