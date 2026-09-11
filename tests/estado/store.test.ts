import { beforeEach, describe, expect, it } from 'vitest';
import { estadoInicial, useStore } from '../../src/estado/store';
import { limitesDaGrade, pixelsDaCena } from '../../src/estado/seletores';
import { criarReta, criarPoligono } from '../../src/core/cena/objetos';
import { criarSessao } from '../../src/depurador/sessao';
import { algoritmoDDA } from '../../src/core/rasterizacao/dda';
import { HISTORICO_MAX } from '../../src/estado/sliceCena';

const COR = '#2563eb';

function sessaoCurta() {
  return criarSessao(algoritmoDDA, { x1: 0, y1: 0, x2: 2, y2: 0 }, { corPadrao: COR });
}

describe('store', () => {
  beforeEach(() => {
    useStore.setState(estadoInicial());
  });

  it('estado inicial: grade 40x30 no canto, eixos visíveis, módulo dda', () => {
    const s = useStore.getState();
    expect(s.grade).toMatchObject({ largura: 40, altura: 30, origem: { x: 0, y: 0 }, modoOrigem: 'canto', mostrarEixos: true });
    expect(s.ui.moduloAtivo).toBe('dda');
    expect(s.depuracao.velocidade).toBe(4);
    expect(limitesDaGrade(s.grade)).toEqual({ xmin: 0, ymin: 0, xmax: 39, ymax: 29 });
  });

  it('adicionarObjeto gera nome e desfazer restaura', () => {
    const id = useStore.getState().adicionarObjeto(criarReta({ x: 0, y: 0 }, { x: 3, y: 0 }, COR));
    useStore.getState().adicionarObjeto(criarReta({ x: 0, y: 1 }, { x: 3, y: 1 }, COR));
    useStore.getState().adicionarObjeto(criarPoligono([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 2 }], COR));
    const { objetos } = useStore.getState().cena;
    expect(objetos.map((o) => o.nome)).toEqual(['Reta 1', 'Reta 2', 'Polígono 1']);
    expect(objetos[0].id).toBe(id);

    useStore.getState().desfazer();
    expect(useStore.getState().cena.objetos.map((o) => o.nome)).toEqual(['Reta 1', 'Reta 2']);
    useStore.getState().desfazer();
    useStore.getState().desfazer();
    expect(useStore.getState().cena.objetos).toEqual([]);
    useStore.getState().desfazer(); // sem histórico: não faz nada
    expect(useStore.getState().cena.objetos).toEqual([]);
  });

  it('histórico limitado a HISTORICO_MAX snapshots', () => {
    for (let i = 0; i < HISTORICO_MAX + 10; i++) {
      useStore.getState().adicionarObjeto(criarReta({ x: 0, y: i }, { x: 1, y: i }, COR));
    }
    expect(useStore.getState().cena.historico).toHaveLength(HISTORICO_MAX);
  });

  it('removerObjeto e substituirObjetos', () => {
    const id = useStore.getState().adicionarObjeto(criarReta({ x: 0, y: 0 }, { x: 3, y: 0 }, COR));
    const original = useStore.getState().cena.objetos[0];
    if (original.tipo !== 'reta') throw new Error('esperava reta');
    useStore.getState().substituirObjetos([{ ...original, p2: { x: 9, y: 9 } }]);
    const trocado = useStore.getState().cena.objetos[0];
    expect(trocado.tipo === 'reta' && trocado.p2).toEqual({ x: 9, y: 9 });
    useStore.getState().removerObjeto(id);
    expect(useStore.getState().cena.objetos).toEqual([]);
  });

  it('selecionarPorRegiao marca só os objetos contidos e guarda a região', () => {
    useStore.getState().adicionarObjeto(criarReta({ x: 1, y: 1 }, { x: 3, y: 3 }, COR));
    useStore.getState().adicionarObjeto(criarReta({ x: 1, y: 1 }, { x: 30, y: 3 }, COR));
    const regiao = { xmin: 0, ymin: 0, xmax: 5, ymax: 5 };
    useStore.getState().selecionarPorRegiao(regiao);
    const { objetos, regiaoSelecao } = useStore.getState().cena;
    expect(objetos.map((o) => o.selecionado)).toEqual([true, false]);
    expect(regiaoSelecao).toEqual(regiao);

    useStore.getState().alternarSelecao(objetos[1].id);
    expect(useStore.getState().cena.objetos.map((o) => o.selecionado)).toEqual([true, true]);
    useStore.getState().limparSelecao();
    expect(useStore.getState().cena.objetos.some((o) => o.selecionado)).toBe(false);
    expect(useStore.getState().cena.regiaoSelecao).toBeNull();
  });

  it('ativarModulo encerra a sessão e limpa a seleção, mantendo objetos e janela', () => {
    useStore.getState().adicionarObjeto(criarReta({ x: 1, y: 1 }, { x: 3, y: 3 }, COR));
    useStore.getState().selecionarPorRegiao({ xmin: 0, ymin: 0, xmax: 5, ymax: 5 });
    useStore.getState().definirJanelaRecorte({ xmin: 2, ymin: 2, xmax: 8, ymax: 8 });
    useStore.getState().iniciarDepuracao(sessaoCurta(), ['x']);
    useStore.getState().irPara(2);

    useStore.getState().ativarModulo('bresenham-reta');
    const s = useStore.getState();
    expect(s.ui.moduloAtivo).toBe('bresenham-reta');
    expect(s.depuracao.sessao).toBeNull();
    expect(s.depuracao.indice).toBe(-1);
    expect(s.depuracao.objetosOcultos).toEqual([]);
    expect(s.cena.objetos).toHaveLength(1);
    expect(s.cena.objetos[0].selecionado).toBe(false);
    expect(s.cena.janelaRecorte).toEqual({ xmin: 2, ymin: 2, xmax: 8, ymax: 8 });
  });

  it('avancar devolve false no fim e desliga a execução', () => {
    const sessao = sessaoCurta();
    useStore.getState().iniciarDepuracao(sessao);
    expect(useStore.getState().depuracao.indice).toBe(-1);
    useStore.getState().alternarExecucao();
    expect(useStore.getState().depuracao.executando).toBe(true);

    for (let i = 0; i < sessao.passos.length; i++) expect(useStore.getState().avancar()).toBe(true);
    expect(useStore.getState().depuracao.indice).toBe(sessao.passos.length - 1);
    expect(useStore.getState().depuracao.executando).toBe(false);
    expect(useStore.getState().avancar()).toBe(false);

    useStore.getState().retroceder();
    expect(useStore.getState().depuracao.indice).toBe(sessao.passos.length - 2);
    useStore.getState().irAoFim();
    expect(useStore.getState().depuracao.indice).toBe(sessao.passos.length - 1);
    useStore.getState().irPara(999);
    expect(useStore.getState().depuracao.indice).toBe(sessao.passos.length - 1);
    useStore.getState().irPara(-50);
    expect(useStore.getState().depuracao.indice).toBe(-1);
    useStore.getState().reiniciar();
    expect(useStore.getState().depuracao.indice).toBe(-1);
    expect(useStore.getState().avancar()).toBe(true);
    expect(useStore.getState().depuracao.indice).toBe(0);
  });

  it('avancar sem sessão devolve false', () => {
    expect(useStore.getState().avancar()).toBe(false);
  });

  it('definirVelocidade limita a 1..30', () => {
    useStore.getState().definirVelocidade(100);
    expect(useStore.getState().depuracao.velocidade).toBe(30);
    useStore.getState().definirVelocidade(0);
    expect(useStore.getState().depuracao.velocidade).toBe(1);
  });

  it("definirModoOrigem('centro') em 40x30 → origem (20,15)", () => {
    useStore.getState().definirModoOrigem('centro');
    expect(useStore.getState().grade.origem).toEqual({ x: 20, y: 15 });
    expect(limitesDaGrade(useStore.getState().grade)).toEqual({ xmin: -20, ymin: -15, xmax: 19, ymax: 14 });
    useStore.getState().definirTamanho(21, 11);
    expect(useStore.getState().grade.origem).toEqual({ x: 10, y: 5 });
    useStore.getState().definirModoOrigem('canto');
    expect(useStore.getState().grade.origem).toEqual({ x: 0, y: 0 });
  });

  it('definirTamanho e limparCena encerram a depuração', () => {
    useStore.getState().iniciarDepuracao(sessaoCurta());
    useStore.getState().definirTamanho(50, 50);
    expect(useStore.getState().depuracao.sessao).toBeNull();
    expect(useStore.getState().grade).toMatchObject({ largura: 50, altura: 50 });

    useStore.getState().adicionarObjeto(criarReta({ x: 0, y: 0 }, { x: 3, y: 0 }, COR));
    useStore.getState().iniciarDepuracao(sessaoCurta());
    useStore.getState().limparCena();
    expect(useStore.getState().cena.objetos).toEqual([]);
    expect(useStore.getState().depuracao.sessao).toBeNull();
    useStore.getState().desfazer();
    expect(useStore.getState().cena.objetos).toHaveLength(1);
  });

  it('pixelsDaCena rasteriza os objetos e respeita os ocultos', () => {
    const id = useStore.getState().adicionarObjeto(criarReta({ x: 0, y: 0 }, { x: 3, y: 0 }, COR));
    const { objetos } = useStore.getState().cena;
    expect(pixelsDaCena(objetos)).toHaveLength(4);
    expect(pixelsDaCena(objetos)[0].cor).toBe(COR);
    expect(pixelsDaCena(objetos, [id])).toHaveLength(0);
  });
});
