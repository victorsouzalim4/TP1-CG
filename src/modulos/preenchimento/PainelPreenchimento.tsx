/**
 * Módulo de preenchimento, compartilhado por Boundary Fill e Flood Fill (a interação é quase a
 * mesma; muda o algoritmo e a cor que limita a região).
 *
 * Fluxo:
 *  1. desenhar um contorno fechado com Polígono ou Circunferência (ou usar objetos já existentes);
 *  2. escolher `cor_preenche` na paleta;
 *  3. Boundary: escolher `cor_contorno` na paleta ou com o conta-gotas (clique num pixel lê a cor);
 *     Flood: `cor_antiga` é lida na célula da semente;
 *  4. escolher a conectividade (4 ou 8);
 *  5. clicar na semente → sessão de depuração sobre a matriz de pixels da cena.
 * "Manter preenchimento" guarda o resultado como um objeto `preenchimento` da cena.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Algoritmo, Overlay, Ponto } from '../../core/tipos';
import { COR_FUNDO, COR_OVERLAY, COR_PADRAO, PALETA, nomeDaCor } from '../../core/cores';
import { MatrizPixels } from '../../core/matrizPixels';
import { criarCirculo, criarPoligono, criarPreenchimento } from '../../core/cena/objetos';
import { algoritmoBoundaryFillPara } from '../../core/preenchimento/boundaryFill';
import { algoritmoFloodFillPara } from '../../core/preenchimento/floodFill';
import type { ParametrosPreenchimento, ResultadoPreenchimento } from '../../core/preenchimento/comum';
import { useStore } from '../../estado/store';
import { limitesDaGrade, pixelsDaCena, usePixelsBase } from '../../estado/seletores';
import type { Ferramenta } from '../../ferramentas/tipos';
import { useFerramentaPoligono } from '../../ferramentas/useFerramentaPoligono';
import { useFerramentaCirculo } from '../../ferramentas/useFerramentaCirculo';
import { useFerramentaClique } from '../../ferramentas/useFerramentaClique';
import { useFerramentaSemente } from '../../ferramentas/useFerramentaSemente';
import { ModuloConectado } from '../../componentes/conectados/ModuloConectado';
import { Botao } from '../../componentes/controles/Botao';
import { BotoesSegmentados, type OpcaoSegmentada } from '../../componentes/controles/BotoesSegmentados';
import { Instrucoes } from '../../componentes/controles/Instrucoes';
import { Paleta } from '../../componentes/controles/Paleta';
import { executarAlgoritmo } from '../comum/executar';

export type TipoPreenchimento = 'boundary' | 'flood';

export interface PainelPreenchimentoProps {
  tipo: TipoPreenchimento;
  /** Texto curto sobre o algoritmo, exibido no painel. */
  sobre: ReactNode;
}

type Modo = 'poligono' | 'circulo' | 'contagotas' | 'semente';
type Conectividade = 4 | 8;

/** Dados da última execução (para exibir, reexecutar e marcar a semente). */
interface UltimaExecucao {
  semente: Ponto;
  /** Cor lida na semente (é a `cor_antiga` do Flood Fill). */
  corSemente: string;
}

const CONECTIVIDADES: readonly OpcaoSegmentada<Conectividade>[] = [
  { valor: 4, rotulo: '4 vizinhos', titulo: 'Direita, esquerda, cima e baixo' },
  { valor: 8, rotulo: '8 vizinhos', titulo: 'Os 4 diretos mais as 4 diagonais' },
];

/** Cor de preenchimento inicial: azul, que contrasta com o contorno preto padrão. */
const COR_PREENCHE_INICIAL = PALETA[3].hex;

function algoritmoPara(tipo: TipoPreenchimento, c: Conectividade): Algoritmo<ParametrosPreenchimento, ResultadoPreenchimento> {
  return tipo === 'boundary' ? algoritmoBoundaryFillPara(c) : algoritmoFloodFillPara(c);
}

/** Matriz de pixels da cena atual (todos os objetos), do tamanho da grade. */
function matrizDaCena(): MatrizPixels {
  const { cena, grade } = useStore.getState();
  return MatrizPixels.deCena(pixelsDaCena(cena.objetos), limitesDaGrade(grade));
}

/** Quadradinho com a cor + nome legível. */
function AmostraCor({ hex }: { hex: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          borderRadius: 3,
          background: hex,
          border: '1px solid var(--cor-borda-forte, #94a3b8)',
        }}
      />
      <strong>{nomeDaCor(hex)}</strong>
    </span>
  );
}

/** Acrescenta à ferramenta um contorno na célula sob o mouse (semente e conta-gotas). */
function comCursor(f: Ferramenta, hover: Ponto | null, rotulo?: string): Ferramenta {
  if (!hover) return f;
  const cursor: Overlay = { tipo: 'celula', x: hover.x, y: hover.y, cor: COR_OVERLAY.selecao, estilo: 'contorno', rotulo };
  return { ...f, overlays: [...f.overlays, cursor] };
}

export function PainelPreenchimento({ tipo, sobre }: PainelPreenchimentoProps) {
  const hover = useStore((s) => s.ui.hover);
  const corDesenho = useStore((s) => s.ui.corAtual);
  const temObjetos = useStore((s) => s.cena.objetos.length > 0);
  const sessao = useStore((s) => s.depuracao.sessao);
  const adicionarObjeto = useStore((s) => s.adicionarObjeto);
  const encerrarDepuracao = useStore((s) => s.encerrarDepuracao);
  const pixelsBase = usePixelsBase();

  const [modo, setModo] = useState<Modo>(() => (useStore.getState().cena.objetos.length > 0 ? 'semente' : 'poligono'));
  const [corPreenche, setCorPreenche] = useState(COR_PREENCHE_INICIAL);
  const [corContorno, setCorContorno] = useState(COR_PADRAO);
  const [conectividade, setConectividade] = useState<Conectividade>(4);
  const [ultima, setUltima] = useState<UltimaExecucao | null>(null);
  const [aviso, setAviso] = useState<string | undefined>();

  // Cena esvaziada (Limpar, Desfazer): volta a ferramenta para o desenho do contorno.
  useEffect(() => {
    if (!temObjetos) setModo((m) => (m === 'semente' || m === 'contagotas' ? 'poligono' : m));
  }, [temObjetos]);

  // Cor de cada célula da cena, para o conta-gotas e para mostrar a cor sob o cursor.
  const coresCena = useMemo(() => {
    const m = new Map<string, string>();
    for (const px of pixelsBase) m.set(`${px.x},${px.y}`, px.cor ?? COR_PADRAO);
    return m;
  }, [pixelsBase]);
  const corEm = (p: Ponto): string => coresCena.get(`${p.x},${p.y}`) ?? COR_FUNDO;

  // A sessão ativa é sempre deste módulo (trocar de módulo encerra a depuração).
  const resultado = (sessao?.resultado ?? null) as ResultadoPreenchimento | null;

  function executar(semente: Ponto, c: Conectividade = conectividade): void {
    const matriz = matrizDaCena();
    const corSemente = matriz.inquirirCor(semente.x, semente.y);
    const params: ParametrosPreenchimento = {
      x: semente.x,
      y: semente.y,
      corPreenche,
      conectividade: c,
      matriz,
      ...(tipo === 'boundary' ? { corContorno } : { corAntiga: corSemente }),
    };
    setUltima({ semente, corSemente });
    const erro = executarAlgoritmo(algoritmoPara(tipo, c), params, { cor: corPreenche });
    if (erro) {
      setAviso(erro);
      return;
    }
    const total = (useStore.getState().depuracao.sessao?.resultado as ResultadoPreenchimento | undefined)?.total ?? 0;
    if (total > 0) setAviso(undefined);
    else if (tipo === 'flood' && corSemente === corPreenche) setAviso('cor_antiga = cor_preenche: não há o que recolorir');
    else if (tipo === 'boundary' && corSemente === corContorno) setAviso('A semente está sobre o contorno: nada a pintar');
    else setAviso('Nenhum pixel pintado');
  }

  /** Um contorno novo entra na cena: descarta o preenchimento provisório e vai para a semente. */
  function contornoConcluido(cor: string): void {
    encerrarDepuracao();
    if (tipo === 'boundary') setCorContorno(cor);
    setModo('semente');
    setAviso(undefined);
  }

  const poligono = useFerramentaPoligono({
    hover,
    cor: corDesenho,
    aoConcluir(vertices) {
      adicionarObjeto(criarPoligono(vertices, corDesenho));
      contornoConcluido(corDesenho);
    },
  });

  const circulo = useFerramentaCirculo({
    hover,
    cor: corDesenho,
    aoConcluir(centro, raio) {
      adicionarObjeto(criarCirculo(centro, raio, corDesenho));
      contornoConcluido(corDesenho);
    },
  });

  const contaGotas = useFerramentaClique({
    instrucao: 'Conta-gotas: clique num pixel do contorno para ler cor_contorno',
    aoConcluir(p) {
      const c = corEm(p);
      if (c === COR_FUNDO) {
        setAviso(`A célula (${p.x}, ${p.y}) está vazia: clique num pixel do contorno`);
        return;
      }
      setCorContorno(c);
      setAviso(undefined);
      setModo('semente');
    },
  });

  const semente = useFerramentaSemente({ aoConcluir: (p) => executar(p) });

  function trocarModo(m: Modo): void {
    poligono.cancelar();
    circulo.cancelar();
    setModo(m);
  }

  function trocarConectividade(c: Conectividade): void {
    setConectividade(c);
    // Com uma execução em andamento, reexecuta na hora para comparar 4 × 8 na mesma semente.
    if (ultima && sessao) executar(ultima.semente, c);
  }

  function manter(): void {
    if (!resultado || resultado.total === 0) return;
    adicionarObjeto(criarPreenchimento(resultado.pixels, corPreenche));
    encerrarDepuracao();
    setAviso(undefined);
  }

  let ferramenta: Ferramenta;
  switch (modo) {
    case 'poligono':
      ferramenta = poligono;
      break;
    case 'circulo':
      ferramenta = circulo;
      break;
    case 'contagotas':
      ferramenta = comCursor(contaGotas, hover, hover ? nomeDaCor(corEm(hover)) : undefined);
      break;
    case 'semente':
      ferramenta = comCursor(semente, hover);
      break;
  }

  // Marca a semente da execução exibida.
  const overlaysModulo = useMemo<Overlay[]>(
    () =>
      sessao && ultima
        ? [{ tipo: 'celula', x: ultima.semente.x, y: ultima.semente.y, cor: COR_OVERLAY.selecao, estilo: 'contorno', rotulo: 'semente' }]
        : [],
    [sessao, ultima],
  );

  const modos: OpcaoSegmentada<Modo>[] = [
    { valor: 'poligono', rotulo: 'Polígono', titulo: 'Desenhar um contorno poligonal (cliques nos vértices)' },
    { valor: 'circulo', rotulo: 'Círculo', titulo: 'Desenhar uma circunferência (centro e raio)' },
    ...(tipo === 'boundary'
      ? [{ valor: 'contagotas' as const, rotulo: 'Conta-gotas', titulo: 'Clique num pixel para ler cor_contorno' }]
      : []),
    { valor: 'semente', rotulo: 'Semente', titulo: 'Clique na célula inicial do preenchimento' },
  ];

  const passosInstrucao = [
    'Desenhe um contorno fechado (Polígono ou Círculo) ou use objetos já existentes',
    'Escolha cor_preenche na paleta',
    tipo === 'boundary'
      ? 'Escolha cor_contorno na paleta ou com o conta-gotas'
      : 'cor_antiga é a cor da célula clicada como semente',
    'Escolha a conectividade (4 ou 8)',
    'Clique na semente, dentro da região',
    'Acompanhe a execução; "Manter preenchimento" guarda o resultado',
  ];
  let passoAtual: number;
  if (sessao) passoAtual = 5;
  else if (modo === 'poligono' || modo === 'circulo') passoAtual = 0;
  else if (modo === 'contagotas') passoAtual = 2;
  else passoAtual = temObjetos ? 4 : 0;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={passosInstrucao} atual={passoAtual} />
      </section>

      <section>
        <h3 className="secao__titulo">Ferramenta</h3>
        <div className="pilha">
          <BotoesSegmentados opcoes={modos} valor={modo} onChange={trocarModo} compacto rotulo="Ferramenta ativa" />
          {modo === 'poligono' && (
            <div className="linha">
              <Botao pequeno variante="primario" disabled={!poligono.podeFechar} onClick={poligono.fechar} title="Liga o último vértice ao primeiro">
                Fechar polígono
              </Botao>
              <Botao pequeno disabled={poligono.verticesAtuais.length === 0} onClick={poligono.cancelar}>
                Cancelar
              </Botao>
            </div>
          )}
          {modo === 'circulo' && circulo.centro && (
            <div className="linha">
              <Botao pequeno onClick={circulo.cancelar}>Cancelar centro</Botao>
            </div>
          )}
          {(modo === 'poligono' || modo === 'circulo') && (
            <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
              O contorno usa a cor de desenho da barra superior.
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Cores</h3>
        <div className="pilha">
          <Paleta rotulo="cor_preenche" valor={corPreenche} onChange={setCorPreenche} compacta />
          {tipo === 'boundary' ? (
            <>
              <Paleta rotulo="cor_contorno" valor={corContorno} onChange={setCorContorno} compacta />
              <div className="linha texto-pequeno">
                <AmostraCor hex={corContorno} />
                <Botao pequeno ativo={modo === 'contagotas'} onClick={() => trocarModo('contagotas')} title="Clique depois num pixel do contorno">
                  Conta-gotas
                </Botao>
              </div>
            </>
          ) : (
            <div className="texto-pequeno">
              <span className="controle__rotulo">cor_antiga (lida na semente)</span>
              <div>{ultima ? <AmostraCor hex={ultima.corSemente} /> : <span className="texto-suave">— clique na semente</span>}</div>
            </div>
          )}
          {hover && (modo === 'semente' || modo === 'contagotas') && (
            <div className="texto-pequeno texto-suave">
              Sob o cursor ({hover.x}, {hover.y}): <AmostraCor hex={corEm(hover)} />
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Conectividade</h3>
        <BotoesSegmentados opcoes={CONECTIVIDADES} valor={conectividade} onChange={trocarConectividade} rotulo="Conectividade" />
      </section>

      <section>
        <h3 className="secao__titulo">Resultado</h3>
        {sessao && resultado && ultima ? (
          <p className="texto-pequeno" style={{ margin: '0 0 6px' }}>
            Semente ({ultima.semente.x}, {ultima.semente.y}): <strong>{resultado.total}</strong>{' '}
            {resultado.total === 1 ? 'pixel pintado' : 'pixels pintados'} em {sessao.passos.length}{' '}
            {sessao.passos.length === 1 ? 'passo' : 'passos'}
            {sessao.truncado && ` (limite atingido: ${sessao.passosOmitidos} passos omitidos)`}.
          </p>
        ) : (
          <p className="texto-suave texto-pequeno" style={{ margin: '0 0 6px' }}>
            Nenhum preenchimento em andamento.
          </p>
        )}
        <div className="linha">
          <Botao
            variante="primario"
            pequeno
            disabled={!sessao || !resultado || resultado.total === 0}
            onClick={manter}
            title="Adiciona os pixels pintados à cena como um objeto Preenchimento"
          >
            Manter preenchimento
          </Botao>
          <Botao pequeno disabled={!ultima} onClick={() => ultima && executar(ultima.semente)} title="Executa de novo na última semente, com as opções atuais">
            Nova execução
          </Botao>
          <Botao pequeno disabled={!sessao} onClick={encerrarDepuracao} title="Descarta o preenchimento provisório">
            Descartar
          </Botao>
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Sobre o algoritmo</h3>
        <div className="texto-pequeno">{sobre}</div>
      </section>
    </>
  );

  return <ModuloConectado painel={painel} ferramenta={ferramenta} overlays={overlaysModulo} aviso={aviso} />;
}
