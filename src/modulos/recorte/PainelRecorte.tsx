/**
 * Módulo de recorte de retas, compartilhado por Cohen-Sutherland e Liang-Barsky (a interação é a
 * mesma; muda só o algoritmo executado).
 *
 * Fluxo:
 *  1. Arrastar na grade define a janela de recorte (guardada no store: vale para os dois módulos e
 *     sobrevive à troca de módulo). "Redefinir janela" volta a este passo.
 *  2. Dois cliques definem a reta P1–P2: ela entra na cena e a depuração começa. Durante a sessão
 *     a reta fica oculta da camada base e é redesenhada esmaecida por overlay.
 *  3. "Manter recorte" troca a reta pelo segmento recortado (ou a remove, se foi rejeitada).
 *
 * Overlays próprios do módulo: as retas suporte das 4 fronteiras (que dividem o plano nas 9
 * regiões), o código de 4 bits de cada região e a reta original esmaecida.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Algoritmo, Overlay, Ponto, Retangulo } from '../../core/tipos';
import type { ParametrosRecorte, ResultadoRecorte } from '../../core/recorte/comum';
import { rotulosDasRegioes } from '../../core/recorte/regiaoCodigo';
import { criarReta, type ObjetoReta } from '../../core/cena/objetos';
import { COR_OVERLAY } from '../../core/cores';
import { formatarNumero } from '../../core/geometria';
import { useStore } from '../../estado/store';
import { useLimitesGrade } from '../../estado/seletores';
import { useFerramentaJanela } from '../../ferramentas/useFerramentaJanela';
import { useFerramentaReta } from '../../ferramentas/useFerramentaReta';
import { ModuloConectado } from '../../componentes/conectados/ModuloConectado';
import { Botao } from '../../componentes/controles/Botao';
import { Instrucoes } from '../../componentes/controles/Instrucoes';
import { executarAlgoritmo } from '../comum/executar';

export interface PainelRecorteProps {
  algoritmo: Algoritmo<ParametrosRecorte, ResultadoRecorte>;
  /** Texto curto sobre o algoritmo, exibido no painel. */
  sobre: ReactNode;
}

/** Reta e parâmetros da sessão em andamento (para a reta esmaecida e o "Manter recorte"). */
interface Execucao {
  id: string;
  params: ParametrosRecorte;
}

/** Janela e retas dos slides (P1–P2, P4–P3, P5–P6), para reproduzir os exemplos com um clique. */
const JANELA_SLIDES: Retangulo = { xmin: 0, ymin: 0, xmax: 6, ymax: 5 };
const EXEMPLOS: Array<{ rotulo: string; p1: Ponto; p2: Ponto; dica: string }> = [
  { rotulo: 'P1–P2', p1: { x: -3, y: 1 }, p2: { x: 4, y: 2 }, dica: 'P1(−3, 1) → P2(4, 2): parcialmente dentro' },
  { rotulo: 'P4–P3', p1: { x: -1, y: 8 }, p2: { x: 8, y: -1 }, dica: 'P4(−1, 8) → P3(8, −1): cruza 3 fronteiras' },
  { rotulo: 'P5–P6', p1: { x: -1, y: 4 }, p2: { x: -1, y: 6 }, dica: 'P5(−1, 4) → P6(−1, 6): totalmente fora' },
];

const PASSOS_INSTRUCAO = [
  'Arraste na grade para definir a janela de recorte',
  'Clique nos extremos P1 e P2 da reta',
  'Acompanhe o recorte; "Manter recorte" aplica o resultado à cena',
];

function fmt(x: number, y: number): string {
  return `(${formatarNumero(x)}, ${formatarNumero(y)})`;
}

function textoJanela(j: Retangulo): string {
  return `x ∈ [${formatarNumero(j.xmin)}, ${formatarNumero(j.xmax)}], y ∈ [${formatarNumero(j.ymin)}, ${formatarNumero(j.ymax)}]`;
}

function mesmaJanela(a: Retangulo, b: Retangulo): boolean {
  return a.xmin === b.xmin && a.ymin === b.ymin && a.xmax === b.xmax && a.ymax === b.ymax;
}

export function PainelRecorte({ algoritmo, sobre }: PainelRecorteProps) {
  const hover = useStore((s) => s.ui.hover);
  const cor = useStore((s) => s.ui.corAtual);
  const janela = useStore((s) => s.cena.janelaRecorte);
  const sessao = useStore((s) => s.depuracao.sessao);
  const indice = useStore((s) => s.depuracao.indice);
  const ocultos = useStore((s) => s.depuracao.objetosOcultos);
  const adicionarObjeto = useStore((s) => s.adicionarObjeto);
  const substituirObjetos = useStore((s) => s.substituirObjetos);
  const removerObjeto = useStore((s) => s.removerObjeto);
  const definirJanelaRecorte = useStore((s) => s.definirJanelaRecorte);
  const encerrarDepuracao = useStore((s) => s.encerrarDepuracao);
  const limites = useLimitesGrade();

  const [redefinindo, setRedefinindo] = useState(false);
  const [ultimaId, setUltimaId] = useState<string | null>(null);
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [aviso, setAviso] = useState<string | undefined>();

  // A reta pode ter sido removida (Desfazer, Limpar, aba Objetos): aí não dá para repetir.
  const ultima = useStore((s) => {
    const obj = ultimaId === null ? undefined : s.cena.objetos.find((o) => o.id === ultimaId);
    return obj?.tipo === 'reta' ? obj : undefined;
  });

  // A sessão ativa é "deste módulo" se foi criada por este algoritmo e oculta a reta executada.
  const sessaoPropria =
    sessao !== null && execucao !== null && sessao.algoritmoId === algoritmo.id && ocultos.includes(execucao.id);
  const resultado = sessaoPropria ? (sessao.resultado as ResultadoRecorte) : null;
  const concluido = sessaoPropria && indice === sessao.passos.length - 1;
  const modoJanela = janela === null || redefinindo;

  function executar(obj: ObjetoReta, j: Retangulo): void {
    const params: ParametrosRecorte = { x1: obj.p1.x, y1: obj.p1.y, x2: obj.p2.x, y2: obj.p2.y, janela: j };
    const erro = executarAlgoritmo(algoritmo, params, { cor: obj.cor, ocultos: [obj.id] });
    setAviso(erro ?? undefined);
    setExecucao(erro ? null : { id: obj.id, params });
  }

  /** Adiciona a reta à cena e já inicia o recorte. */
  function novaReta(p1: Ponto, p2: Ponto, j: Retangulo): void {
    const obj = criarReta(p1, p2, cor, 'bresenham');
    const id = adicionarObjeto(obj);
    setUltimaId(id);
    executar({ ...obj, id }, j);
  }

  const ferramentaJanela = useFerramentaJanela({
    aoDefinir(r) {
      definirJanelaRecorte(r);
      setRedefinindo(false);
      // Com uma reta já desenhada, recorta-a de novo contra a nova janela.
      if (ultima) executar(ultima, r);
    },
  });

  const ferramentaReta = useFerramentaReta({
    hover,
    cor,
    aoConcluir(p1, p2) {
      if (janela) novaReta(p1, p2, janela);
    },
  });

  const ferramenta = modoJanela ? ferramentaJanela : ferramentaReta;

  function repetir(): void {
    if (ultima && janela) executar(ultima, janela);
  }

  function exemplo(p1: Ponto, p2: Ponto): void {
    if (!janela || !mesmaJanela(janela, JANELA_SLIDES)) definirJanelaRecorte(JANELA_SLIDES);
    setRedefinindo(false);
    ferramentaReta.cancelar();
    novaReta(p1, p2, JANELA_SLIDES);
  }

  function manterRecorte(): void {
    if (!sessaoPropria || !resultado || !execucao) return;
    const obj = useStore.getState().cena.objetos.find((o) => o.id === execucao.id);
    encerrarDepuracao();
    setExecucao(null);
    if (!obj || obj.tipo !== 'reta') return;
    if (resultado.aceito && resultado.segmento) {
      const s = resultado.segmento;
      substituirObjetos([{ ...obj, p1: { x: s.x1, y: s.y1 }, p2: { x: s.x2, y: s.y2 } }]);
    } else {
      removerObjeto(obj.id);
      setUltimaId(null);
    }
  }

  function iniciarRedefinicao(): void {
    ferramentaReta.cancelar();
    setRedefinindo(true);
  }

  // Overlays próprios: fronteiras estendidas, códigos das 9 regiões e a reta original esmaecida.
  const overlays = useMemo<Overlay[]>(() => {
    const lista: Overlay[] = [];
    if (janela) {
      const x0 = limites.xmin - 0.5;
      const x1 = limites.xmax + 0.5;
      const y0 = limites.ymin - 0.5;
      const y1 = limites.ymax + 0.5;
      const c = COR_OVERLAY.janela;
      lista.push(
        { tipo: 'segmento', x1: janela.xmin, y1: y0, x2: janela.xmin, y2: y1, cor: c, tracejado: true, opacidade: 0.35 },
        { tipo: 'segmento', x1: janela.xmax, y1: y0, x2: janela.xmax, y2: y1, cor: c, tracejado: true, opacidade: 0.35 },
        { tipo: 'segmento', x1: x0, y1: janela.ymin, x2: x1, y2: janela.ymin, cor: c, tracejado: true, opacidade: 0.35 },
        { tipo: 'segmento', x1: x0, y1: janela.ymax, x2: x1, y2: janela.ymax, cor: c, tracejado: true, opacidade: 0.35 },
      );
      for (const r of rotulosDasRegioes(janela, limites)) {
        lista.push({ tipo: 'texto', x: r.x, y: r.y, texto: r.texto, cor: c });
      }
    }
    if (sessaoPropria && execucao) {
      const p = execucao.params;
      const corReta = ultima?.cor ?? COR_OVERLAY.ideal;
      lista.push({ tipo: 'segmento', x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, cor: corReta, opacidade: 0.3 });
    }
    return lista;
  }, [janela, limites, sessaoPropria, execucao, ultima?.cor]);

  const passoAtual = modoJanela ? 0 : sessaoPropria && ferramentaReta.p1 === null ? 2 : 1;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={PASSOS_INSTRUCAO} atual={passoAtual} />
      </section>

      <section>
        <h3 className="secao__titulo">Janela de recorte</h3>
        {janela ? (
          <p className="texto-pequeno">{textoJanela(janela)}</p>
        ) : (
          <p className="texto-suave texto-pequeno">Nenhuma janela definida: arraste na grade.</p>
        )}
        {redefinindo && <p className="texto-suave texto-pequeno">Arraste na grade para desenhar a nova janela.</p>}
        <div className="linha">
          <Botao pequeno disabled={janela === null || redefinindo} onClick={iniciarRedefinicao} title="Volta ao passo 1: arrastar uma nova janela">
            Redefinir janela
          </Botao>
          {redefinindo && janela !== null && (
            <Botao pequeno onClick={() => setRedefinindo(false)} title="Mantém a janela atual">
              Cancelar
            </Botao>
          )}
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Reta</h3>
        {ultima ? (
          <p className="texto-pequeno">
            P1 = {fmt(ultima.p1.x, ultima.p1.y)} → P2 = {fmt(ultima.p2.x, ultima.p2.y)}
          </p>
        ) : (
          <p className="texto-suave texto-pequeno">Nenhuma reta desenhada neste módulo.</p>
        )}
        <div className="linha">
          <Botao
            variante="primario"
            pequeno
            disabled={!sessaoPropria}
            onClick={manterRecorte}
            title="Substitui a reta pelo segmento recortado (ou a remove, se foi rejeitada)"
          >
            Manter recorte
          </Botao>
          <Botao pequeno disabled={!ultima || janela === null} onClick={repetir} title="Executa de novo o recorte da última reta">
            Nova execução
          </Botao>
          <Botao pequeno disabled={sessao === null} onClick={encerrarDepuracao} title="Encerra a depuração e mantém a reta original">
            Encerrar
          </Botao>
          <Botao pequeno disabled={ferramentaReta.p1 === null} onClick={ferramentaReta.cancelar} title="Descarta o P1 já fixado">
            Cancelar P1
          </Botao>
        </div>
      </section>

      {sessaoPropria && resultado && (
        <section>
          <h3 className="secao__titulo">Resultado</h3>
          {!concluido ? (
            <p className="texto-suave texto-pequeno">Aparece ao fim da execução (ou use ⏭).</p>
          ) : resultado.aceito && resultado.segmento ? (
            <p className="texto-pequeno">
              Aceita: {fmt(resultado.segmento.x1, resultado.segmento.y1)} → {fmt(resultado.segmento.x2, resultado.segmento.y2)} (
              {resultado.pixels.length} pixels)
            </p>
          ) : (
            <p className="texto-pequeno">Rejeitada: a reta está totalmente fora da janela.</p>
          )}
        </section>
      )}

      <section>
        <h3 className="secao__titulo">Exemplos dos slides</h3>
        <p className="texto-suave texto-pequeno">Usam a janela x ∈ [0, 6], y ∈ [0, 5]. Para ver as coordenadas negativas, use a origem "Centro".</p>
        <div className="linha">
          {EXEMPLOS.map((e) => (
            <Botao key={e.rotulo} pequeno onClick={() => exemplo(e.p1, e.p2)} title={e.dica}>
              {e.rotulo}
            </Botao>
          ))}
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Sobre o algoritmo</h3>
        <div className="texto-pequeno">{sobre}</div>
      </section>
    </>
  );

  return (
    <ModuloConectado
      painel={painel}
      ferramenta={ferramenta}
      overlays={overlays}
      regiaoArrasto={modoJanela ? ferramentaJanela.regiaoAtual : null}
      mostrarJanela
      aviso={aviso}
    />
  );
}
