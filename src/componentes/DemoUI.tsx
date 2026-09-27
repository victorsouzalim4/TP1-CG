/**
 * Demonstração da UI base (fase A2) com dados fictícios.
 *
 * Não é usada pelo `App`: existe para validar visualmente os componentes e a integração das
 * ferramentas com a grade sem depender do store/depurador. Monta o AppShell completo com:
 *  - grade 40×30 com objetos de exemplo (rasterizados por um DDA ingênuo local);
 *  - overlays de todos os tipos (quando nenhum passo está ativo);
 *  - execução simulada de um DDA (passos pré-gerados) com transporte, código e variáveis;
 *  - todas as ferramentas de clique/arrasto.
 */
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { Overlay, Passo, Pixel, Ponto, Retangulo, Variaveis } from '../core/tipos';
import { COR_OVERLAY, PALETA } from '../core/cores';
import { dentroDoRetangulo, gerarId } from '../core/geometria';
import { selecionavel, verticesDe, type ObjetoGrafico } from '../core/cena/objetos';
import type { DefinicaoModulo, ModuloId } from '../modulos/registro';

import { PixelGrid } from './grade/PixelGrid';
import { Botao, BotoesSegmentados, Instrucoes, Slider, Stepper } from './controles';
import { AbaCodigo, AbaObjetos, AbaVariaveis, TransporteDepuracao } from './depurador';
import { AppShell, BarraFerramentas, BarraStatus, Cabecalho, LayoutModulo, ListaModulos, PainelDireito, type AbaPainelDireito, type ModoOrigem } from './layout';
import {
  propsGradeDaFerramenta,
  useFerramentaCirculo,
  useFerramentaJanela,
  useFerramentaPoligono,
  useFerramentaPonto,
  useFerramentaReta,
  useFerramentaSelecao,
} from '../ferramentas';

// ---------------------------------------------------------------------------
// Dados fictícios
// ---------------------------------------------------------------------------

const ComponenteVazio: ComponentType = () => null;

const MODULOS_DEMO: readonly DefinicaoModulo[] = [
  { id: 'dda', titulo: 'Reta - DDA', grupo: 'Rasterização', componente: ComponenteVazio },
  { id: 'bresenham-reta', titulo: 'Reta - Bresenham', grupo: 'Rasterização', componente: ComponenteVazio },
  { id: 'bresenham-circulo', titulo: 'Circunferência - Bresenham', grupo: 'Rasterização', componente: ComponenteVazio },
  { id: 'cohen-sutherland', titulo: 'Cohen-Sutherland', grupo: 'Recorte', componente: ComponenteVazio },
  { id: 'liang-barsky', titulo: 'Liang-Barsky', grupo: 'Recorte', componente: ComponenteVazio },
  { id: 'transformacoes', titulo: 'Transformações 2D', grupo: 'Transformações', componente: ComponenteVazio },
  { id: 'boundary-fill', titulo: 'Boundary Fill', grupo: 'Preenchimento', componente: ComponenteVazio },
  { id: 'flood-fill', titulo: 'Flood Fill', grupo: 'Preenchimento', componente: ComponenteVazio },
];

const TAMANHOS = [
  { rotulo: '20×15', largura: 20, altura: 15 },
  { rotulo: '40×30', largura: 40, altura: 30 },
  { rotulo: '80×60', largura: 80, altura: 60 },
];

const CODIGO_DDA = [
  'procedimento DDA(x1, y1, x2, y2)',
  '  dx ← x2 − x1',
  '  dy ← y2 − y1',
  '  passos ← max(|dx|, |dy|)',
  '  incX ← dx / passos',
  '  incY ← dy / passos',
  '  x ← x1;  y ← y1',
  '  para i de 0 até passos faça',
  '    pintar(round(x), round(y))',
  '    x ← x + incX',
  '    y ← y + incY',
  'fim',
].join('\n');

/** Valores de todos os tipos, para conferir a renderização de `ValorVariavel`. */
const VARIAVEIS_EXEMPLO: Variaveis = {
  inteiro: 42,
  real: 3.14159,
  texto: 'aceito',
  verdadeiro: true,
  falso: false,
  nulo: null,
  P1: { tipo: 'ponto', x: 2, y: 3.5 },
  codigo: { tipo: 'bits', valor: 0b1001, rotulos: ['C', 'B', 'D', 'E'] },
  'R(90°)': { tipo: 'matriz', linhas: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], rotulo: 'R' },
  pilha: { tipo: 'pilha', topo: [{ tipo: 'ponto', x: 5, y: 5 }, { tipo: 'ponto', x: 4, y: 5 }], tamanho: 7 },
  tabela: {
    tipo: 'tabela',
    colunas: ['k', 'p_k', 'q_k', 'r_k'],
    linhas: [
      [1, -6, 3, -0.5],
      [2, 6, 21, 3.5],
      [3, -4, 2, -0.5],
      [4, 4, 14, 3.5],
    ],
  },
  lista: { tipo: 'lista', itens: [1, 2, 3, { tipo: 'ponto', x: 0, y: 0 }] },
};

/** Overlays de todos os tipos, exibidos quando nenhum passo está ativo. */
function overlaysExemplo(): Overlay[] {
  return [
    { tipo: 'celula', x: 3, y: 26, cor: COR_OVERLAY.destaque, estilo: 'contorno', rotulo: 'contorno' },
    { tipo: 'celula', x: 6, y: 26, cor: COR_OVERLAY.destaque, estilo: 'preenchido', rotulo: 'preenchido' },
    { tipo: 'ponto-real', x: 9.4, y: 26.6, cor: COR_OVERLAY.selecao, rotulo: '(9.4, 26.6)' },
    { tipo: 'segmento', x1: 12, y1: 24, x2: 20, y2: 28, cor: COR_OVERLAY.ideal, tracejado: true, opacidade: 0.8 },
    { tipo: 'retangulo', ret: { xmin: 22, ymin: 22, xmax: 28, ymax: 27 }, cor: COR_OVERLAY.candidato, tracejado: true, rotulo: 'retângulo' },
    { tipo: 'circulo-ideal', xc: 33, yc: 24, r: 4, cor: COR_OVERLAY.ideal, tracejado: true },
    { tipo: 'poligono-ideal', vertices: [{ x: 30, y: 4 }, { x: 37, y: 6 }, { x: 35, y: 12 }, { x: 29, y: 10 }], cor: COR_OVERLAY.ideal, fechado: true },
    { tipo: 'poligono-ideal', vertices: [{ x: 22, y: 12 }, { x: 25, y: 16 }, { x: 28, y: 12 }], cor: COR_OVERLAY.destaque, tracejado: true },
    { tipo: 'texto', x: 33, y: 17, texto: 'texto centrado' },
    { tipo: 'seta', de: { x: 14, y: 20 }, para: { x: 19, y: 16 }, cor: COR_OVERLAY.janela },
  ];
}

/** Passos de um DDA simulado (gerados de uma vez, para validar o transporte). */
function gerarPassosDDA(p1: Ponto, p2: Ponto): Passo[] {
  const passos: Passo[] = [];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  const incX = dx / n;
  const incY = dy / n;
  const ideal: Overlay = { tipo: 'segmento', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, cor: COR_OVERLAY.ideal, tracejado: true, opacidade: 0.6 };
  const base: Variaveis = { P1: { tipo: 'ponto', x: p1.x, y: p1.y }, P2: { tipo: 'ponto', x: p2.x, y: p2.y } };

  passos.push({ linha: 2, variaveis: { ...base, dx }, overlays: [ideal], descricao: 'Calcula a variação em x' });
  passos.push({ linha: 3, variaveis: { ...base, dx, dy }, overlays: [ideal], descricao: 'Calcula a variação em y' });
  passos.push({ linha: 4, variaveis: { ...base, dx, dy, passos: n }, overlays: [ideal], descricao: 'Número de passos: o maior dos deslocamentos' });
  passos.push({ linha: 5, variaveis: { ...base, dx, dy, passos: n, incX }, overlays: [ideal], descricao: 'Incremento em x por passo' });
  passos.push({ linha: 6, variaveis: { ...base, dx, dy, passos: n, incX, incY }, overlays: [ideal], descricao: 'Incremento em y por passo' });

  let x = p1.x;
  let y = p1.y;
  for (let i = 0; i <= n; i++) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    passos.push({
      linha: 9,
      variaveis: { ...base, dx, dy, passos: n, incX, incY, i, x, y, 'round(x)': rx, 'round(y)': ry },
      pixels: [{ x: rx, y: ry }],
      overlays: [
        ideal,
        { tipo: 'ponto-real', x, y, cor: COR_OVERLAY.destaque, rotulo: `(${x.toFixed(2)}, ${y.toFixed(2)})` },
        { tipo: 'celula', x: rx, y: ry, cor: COR_OVERLAY.destaque, estilo: 'contorno' },
      ],
      descricao: `Pinta o pixel (${rx}, ${ry})`,
    });
    x += incX;
    y += incY;
  }
  passos.push({ linha: 12, variaveis: { ...base, dx, dy, passos: n, incX, incY }, descricao: 'Fim da rasterização' });
  return passos;
}

/** Rasterização ingênua para a camada base da demo (o core real fica a cargo dos algoritmos). */
function segmentoIngenuo(a: Ponto, b: Ponto, cor: string): Pixel[] {
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  const saida: Pixel[] = [];
  for (let i = 0; i <= n; i++) {
    saida.push({ x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), cor });
  }
  return saida;
}

function rasterizarDemo(obj: ObjetoGrafico): Pixel[] {
  switch (obj.tipo) {
    case 'ponto':
      return [{ x: Math.round(obj.p.x), y: Math.round(obj.p.y), cor: obj.cor }];
    case 'reta':
      return segmentoIngenuo(obj.p1, obj.p2, obj.cor);
    case 'poligono':
      return obj.vertices.flatMap((v, i) => segmentoIngenuo(v, obj.vertices[(i + 1) % obj.vertices.length], obj.cor));
    case 'circulo': {
      const vistos = new Set<string>();
      const saida: Pixel[] = [];
      for (let a = 0; a < 360; a += 0.5) {
        const x = Math.round(obj.centro.x + obj.raio * Math.cos((a * Math.PI) / 180));
        const y = Math.round(obj.centro.y + obj.raio * Math.sin((a * Math.PI) / 180));
        const chave = `${x},${y}`;
        if (!vistos.has(chave)) {
          vistos.add(chave);
          saida.push({ x, y, cor: obj.cor });
        }
      }
      return saida;
    }
    case 'preenchimento':
      return obj.pixels;
  }
}

const OBJETOS_INICIAIS: ObjetoGrafico[] = [
  { id: 'demo-reta', nome: 'Reta 1', cor: PALETA[3].hex, selecionado: false, tipo: 'reta', p1: { x: 2, y: 3 }, p2: { x: 24, y: 14 }, rasterizador: 'dda' },
  { id: 'demo-pol', nome: 'Polígono 1', cor: PALETA[2].hex, selecionado: true, tipo: 'poligono', vertices: [{ x: 4, y: 16 }, { x: 10, y: 22 }, { x: 12, y: 15 }] },
  { id: 'demo-circ', nome: 'Circunferência 1', cor: PALETA[4].hex, selecionado: false, tipo: 'circulo', centro: { x: 32, y: 8 }, raio: 5 },
  { id: 'demo-ponto', nome: 'Ponto 1', cor: PALETA[0].hex, selecionado: false, tipo: 'ponto', p: { x: 18, y: 20 } },
];

type FerramentaId = 'reta' | 'ponto' | 'circulo' | 'poligono' | 'selecao' | 'janela';

/** Objeto sem os campos comuns (distribui o `Omit` sobre cada membro da união). */
type ObjetoSemBase<T = ObjetoGrafico> = T extends unknown ? Omit<T, 'id' | 'nome' | 'cor' | 'selecionado'> : never;

const FERRAMENTAS_DESENHO = [
  { valor: 'reta', rotulo: 'Reta' },
  { valor: 'ponto', rotulo: 'Ponto' },
  { valor: 'circulo', rotulo: 'Círculo' },
  { valor: 'poligono', rotulo: 'Polígono' },
] as const;

const FERRAMENTAS_REGIAO = [
  { valor: 'selecao', rotulo: 'Seleção' },
  { valor: 'janela', rotulo: 'Janela' },
] as const;

/** Conjunto de nomes cujo valor difere entre dois snapshots (comparação estrutural). */
function variaveisAlteradas(anterior: Variaveis | undefined, atual: Variaveis): Set<string> {
  const alteradas = new Set<string>();
  for (const nome of Object.keys(atual)) {
    if (!anterior || JSON.stringify(anterior[nome]) !== JSON.stringify(atual[nome])) alteradas.add(nome);
  }
  return alteradas;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function DemoUI() {
  // Grade
  const [tamanho, setTamanho] = useState({ largura: 40, altura: 30 });
  const [modoOrigem, setModoOrigem] = useState<ModoOrigem>('canto');
  const [mostrarEixos, setMostrarEixos] = useState(true);
  const [cor, setCor] = useState(PALETA[3].hex);
  const [hover, setHover] = useState<Ponto | null>(null);
  const origem = useMemo<Ponto>(
    () => (modoOrigem === 'canto' ? { x: 0, y: 0 } : { x: Math.floor(tamanho.largura / 2), y: Math.floor(tamanho.altura / 2) }),
    [modoOrigem, tamanho],
  );

  // Cena
  const [objetos, setObjetos] = useState<ObjetoGrafico[]>(OBJETOS_INICIAIS);
  const [janela, setJanela] = useState<Retangulo | null>({ xmin: 6, ymin: 4, xmax: 26, ymax: 18 });
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('dda');
  const [aba, setAba] = useState<AbaPainelDireito>('codigo');

  // Controles de exemplo do painel
  const [raio, setRaio] = useState(5);
  const [angulo, setAngulo] = useState(90);

  // Execução simulada
  const [passos, setPassos] = useState<Passo[]>([]);
  const [indice, setIndice] = useState(-1);
  const [executando, setExecutando] = useState(false);
  const [velocidade, setVelocidade] = useState(8);

  useEffect(() => {
    if (!executando) return;
    const id = window.setInterval(() => setIndice((i) => Math.min(i + 1, passos.length - 1)), 1000 / velocidade);
    return () => window.clearInterval(id);
  }, [executando, velocidade, passos.length]);

  useEffect(() => {
    if (executando && indice >= passos.length - 1) setExecutando(false);
  }, [executando, indice, passos.length]);

  const passoAtual = indice >= 0 ? passos[indice] : undefined;
  const passoAnterior = indice > 0 ? passos[indice - 1] : undefined;
  const pixelsAlgoritmo = useMemo(() => passos.slice(0, indice + 1).flatMap((p) => p.pixels ?? []), [passos, indice]);

  // Objetos
  function adicionarObjeto(obj: ObjetoSemBase): void {
    const numero = objetos.filter((o) => o.tipo === obj.tipo).length + 1;
    const nomes: Record<ObjetoGrafico['tipo'], string> = { ponto: 'Ponto', reta: 'Reta', poligono: 'Polígono', circulo: 'Circunferência', preenchimento: 'Preenchimento' };
    setObjetos([...objetos, { ...obj, id: gerarId(obj.tipo), nome: `${nomes[obj.tipo]} ${numero}`, cor, selecionado: false } as ObjetoGrafico]);
  }

  function selecionarNaRegiao(r: Retangulo): void {
    setObjetos((lista) => lista.map((o) => ({ ...o, selecionado: selecionavel(o) && verticesDe(o).some((v) => dentroDoRetangulo(v, r)) })));
  }

  // Ferramentas (todas instanciadas; só a escolhida é ligada à grade)
  const [ferramentaId, setFerramentaId] = useState<FerramentaId>('reta');
  const reta = useFerramentaReta({ hover, cor, aoConcluir: (p1, p2) => adicionarObjeto({ tipo: 'reta', p1, p2, rasterizador: 'dda' }) });
  const ponto = useFerramentaPonto({ aoConcluir: (p) => adicionarObjeto({ tipo: 'ponto', p }) });
  const circulo = useFerramentaCirculo({ hover, cor, aoConcluir: (centro, r) => adicionarObjeto({ tipo: 'circulo', centro, raio: r }) });
  const poligono = useFerramentaPoligono({ hover, cor, aoConcluir: (vertices) => adicionarObjeto({ tipo: 'poligono', vertices }) });
  const selecao = useFerramentaSelecao({ aoSelecionar: selecionarNaRegiao });
  const ferramentaJanela = useFerramentaJanela({ aoDefinir: setJanela });
  const ferramentas = { reta, ponto, circulo, poligono, selecao, janela: ferramentaJanela };
  const ferramenta = ferramentas[ferramentaId];
  const regiaoSelecao = ferramentaId === 'selecao' ? selecao.regiaoAtual : ferramentaId === 'janela' ? ferramentaJanela.regiaoAtual : null;

  // Camadas
  const base = useMemo(() => objetos.flatMap(rasterizarDemo), [objetos]);
  const destaqueSelecao = useMemo(() => objetos.filter((o) => o.selecionado).flatMap(rasterizarDemo), [objetos]);
  const overlays = useMemo<Overlay[]>(
    () => [...(passoAtual ? (passoAtual.overlays ?? []) : overlaysExemplo()), ...ferramenta.overlays],
    [passoAtual, ferramenta.overlays],
  );
  const camadas = useMemo(() => ({ base, algoritmo: pixelsAlgoritmo, overlays }), [base, pixelsAlgoritmo, overlays]);

  // Execução
  function iniciarExecucao(): void {
    const ultimaReta = [...objetos].reverse().find((o): o is Extract<ObjetoGrafico, { tipo: 'reta' }> => o.tipo === 'reta');
    const p1 = ultimaReta?.p1 ?? { x: 2, y: 3 };
    const p2 = ultimaReta?.p2 ?? { x: 24, y: 14 };
    setPassos(gerarPassosDDA({ x: Math.round(p1.x), y: Math.round(p1.y) }, { x: Math.round(p2.x), y: Math.round(p2.y) }));
    setIndice(0);
    setExecutando(false);
  }

  const passoInstrucao = passos.length === 0 ? (objetos.length === 0 ? 1 : 2) : 3;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Ferramenta</h3>
        <div className="pilha">
          <BotoesSegmentados<FerramentaId> opcoes={FERRAMENTAS_DESENHO} valor={ferramentaId} onChange={setFerramentaId} rotulo="Desenho" />
          <BotoesSegmentados<FerramentaId> opcoes={FERRAMENTAS_REGIAO} valor={ferramentaId} onChange={setFerramentaId} rotulo="Região" />
          <div className="linha">
            {ferramentaId === 'poligono' && (
              <Botao pequeno variante="primario" disabled={!poligono.podeFechar} onClick={poligono.fechar}>
                Fechar polígono ({poligono.verticesAtuais.length})
              </Botao>
            )}
            <Botao pequeno onClick={ferramenta.cancelar}>
              Cancelar
            </Botao>
            {janela && (
              <Botao pequeno onClick={() => setJanela(null)}>
                Remover janela
              </Botao>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={['Escolha uma ferramenta', 'Clique na grade para desenhar', 'Execute o algoritmo passo a passo']} atual={passoInstrucao} />
      </section>

      <section>
        <h3 className="secao__titulo">Parâmetros (exemplo)</h3>
        <div className="pilha">
          <Stepper rotulo="Raio" valor={raio} min={0} max={30} onChange={setRaio} />
          <Slider
            rotulo="Ângulo (°)"
            valor={angulo}
            min={-180}
            max={180}
            onChange={setAngulo}
            presets={[
              { rotulo: '−90°', valor: -90 },
              { rotulo: '0°', valor: 0 },
              { rotulo: '45°', valor: 45 },
              { rotulo: '90°', valor: 90 },
              { rotulo: '180°', valor: 180 },
            ]}
          />
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Execução</h3>
        <div className="linha">
          <Botao variante="primario" onClick={iniciarExecucao}>
            Executar DDA (demo)
          </Botao>
          <Botao
            disabled={passos.length === 0}
            onClick={() => {
              setPassos([]);
              setIndice(-1);
              setExecutando(false);
            }}
          >
            Encerrar
          </Botao>
        </div>
      </section>
    </>
  );

  const toolbar = (
    <BarraFerramentas
      tamanhos={TAMANHOS}
      tamanhoAtual={tamanho}
      onTamanho={(largura, altura) => setTamanho({ largura, altura })}
      modoOrigem={modoOrigem}
      onModoOrigem={setModoOrigem}
      mostrarEixos={mostrarEixos}
      onAlternarEixos={() => setMostrarEixos((v) => !v)}
      corAtual={cor}
      onCor={setCor}
      onLimpar={() => setObjetos([])}
      onDesfazer={() => setObjetos((lista) => lista.slice(0, -1))}
      podeDesfazer={objetos.length > 0}
      extras={<span className="texto-suave texto-pequeno">{objetos.length} objetos</span>}
    />
  );

  const grade = (
    <PixelGrid
      largura={tamanho.largura}
      altura={tamanho.altura}
      origem={origem}
      camadas={camadas}
      destaqueSelecao={destaqueSelecao}
      regiaoSelecao={regiaoSelecao}
      janelaRecorte={janela}
      mostrarEixos={mostrarEixos}
      onHover={setHover}
      {...propsGradeDaFerramenta(ferramenta)}
    />
  );

  const status = <BarraStatus hover={hover} instrucao={ferramenta.instrucao} aviso={objetos.length === 0 ? 'A cena está vazia' : undefined} />;

  const transporte = (
    <TransporteDepuracao
      indice={indice}
      total={passos.length}
      executando={executando}
      velocidade={velocidade}
      ativo={passos.length > 0}
      onReiniciar={() => {
        setIndice(0);
        setExecutando(false);
      }}
      onRetroceder={() => setIndice((i) => Math.max(0, i - 1))}
      onAlternarExecucao={() => setExecutando((v) => !v)}
      onAvancar={() => setIndice((i) => Math.min(passos.length - 1, i + 1))}
      onIrAoFim={() => {
        setIndice(passos.length - 1);
        setExecutando(false);
      }}
      onVelocidade={setVelocidade}
    />
  );

  return (
    <AppShell
      cabecalho={<Cabecalho titulo="Simulador de Computação Gráfica — TP1" direita={<span className="texto-suave texto-pequeno">Demonstração da UI (fase A2)</span>} />}
      lateral={<ListaModulos modulos={MODULOS_DEMO} ativo={moduloAtivo} onSelecionar={setModuloAtivo} />}
      centro={<LayoutModulo painel={painel} toolbar={toolbar} grade={grade} status={status} transporte={transporte} />}
      direita={
        <PainelDireito
          aba={aba}
          onMudarAba={setAba}
          codigo={
            <AbaCodigo
              titulo="DDA"
              codigo={passos.length > 0 ? CODIGO_DDA : ''}
              linhaAtual={passoAtual?.linha ?? null}
              descricao={passoAtual?.descricao}
            />
          }
          variaveis={
            passoAtual ? (
              <AbaVariaveis variaveis={passoAtual.variaveis} alteradas={variaveisAlteradas(passoAnterior?.variaveis, passoAtual.variaveis)} />
            ) : (
              <AbaVariaveis variaveis={VARIAVEIS_EXEMPLO} alteradas={new Set(['real', 'codigo'])} />
            )
          }
          objetos={
            <AbaObjetos
              objetos={objetos}
              onAlternarSelecao={(id) => setObjetos((lista) => lista.map((o) => (o.id === id ? { ...o, selecionado: !o.selecionado } : o)))}
              onRemover={(id) => setObjetos((lista) => lista.filter((o) => o.id !== id))}
              onLimparSelecao={() => setObjetos((lista) => lista.map((o) => ({ ...o, selecionado: false })))}
            />
          }
        />
      }
    />
  );
}
