/**
 * Módulo "Transformações 2D" (item (a) do TP) — slides "CG 02 Transf 2D".
 *
 * Fluxo:
 *  1. desenhar objetos (Polígono, Reta, Ponto);
 *  2. selecioná-los arrastando um retângulo (ferramenta Selecionar);
 *  3. escolher a transformação, os fatores e o pivô no painel;
 *  4. "Aplicar" monta M = T(p)·X·T(−p) e abre a depuração com os selecionados ocultos: cada
 *     vértice é multiplicado por M passo a passo e o objeto é rasterizado de novo;
 *  5. "Confirmar" grava o resultado na cena (Desfazer volta ao estado anterior); "Cancelar" descarta.
 *
 * A origem da grade vai para o centro ao entrar no módulo: reflexões e rotações em torno da
 * origem produzem coordenadas negativas.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Overlay, Ponto } from '../../core/tipos';
import { COR_OVERLAY } from '../../core/cores';
import { centroide } from '../../core/geometria';
import { paraValor } from '../../core/matriz';
import { criarPoligono, criarPonto, criarReta, transformarObjeto, verticesDe } from '../../core/cena/objetos';
import { montarMatriz, type MatrizMontada } from '../../core/transformacoes/montarMatriz';
import {
  algoritmoTransformacao,
  contornoObjeto,
  type ResultadoTransformacao,
} from '../../core/transformacoes/transformar';
import { useStore } from '../../estado/store';
import { useObjetosSelecionados } from '../../estado/seletores';
import { FERRAMENTA_INATIVA, type Ferramenta } from '../../ferramentas/tipos';
import { useFerramentaPoligono } from '../../ferramentas/useFerramentaPoligono';
import { useFerramentaReta } from '../../ferramentas/useFerramentaReta';
import { useFerramentaPonto } from '../../ferramentas/useFerramentaPonto';
import { useFerramentaSelecao } from '../../ferramentas/useFerramentaSelecao';
import { useFerramentaPivo } from '../../ferramentas/useFerramentaPivo';
import { ModuloConectado } from '../../componentes/conectados/ModuloConectado';
import { Botao } from '../../componentes/controles/Botao';
import { BotoesSegmentados, type OpcaoSegmentada } from '../../componentes/controles/BotoesSegmentados';
import { Instrucoes } from '../../componentes/controles/Instrucoes';
import { ValorVariavel } from '../../componentes/depurador/ValorVariavel';
import { executarAlgoritmo } from '../comum/executar';
import {
  PainelTransformacao,
  paraTransformacao,
  VALORES_INICIAIS,
  type ModoPivo,
  type ValoresTransformacao,
} from './PainelTransformacao';

type TipoFerramenta = 'poligono' | 'reta' | 'ponto' | 'selecao';

const OPCOES_FERRAMENTA: readonly OpcaoSegmentada<TipoFerramenta>[] = [
  { valor: 'poligono', rotulo: 'Polígono', titulo: 'Cada clique é um vértice; feche no 1º vértice (mínimo 3)' },
  { valor: 'reta', rotulo: 'Reta', titulo: 'Dois cliques: P1 e P2' },
  { valor: 'ponto', rotulo: 'Ponto', titulo: 'Um clique por ponto' },
  { valor: 'selecao', rotulo: 'Selecionar', titulo: 'Arraste um retângulo: seleciona os objetos totalmente dentro dele' },
];

const PASSOS_INSTRUCAO = [
  'Desenhe objetos com Polígono, Reta ou Ponto',
  'Use Selecionar e arraste um retângulo sobre eles',
  'Escolha a transformação, os fatores e o pivô',
  'Clique em Aplicar e acompanhe a execução',
  'Confirme (ou cancele) o resultado',
];

export function ModuloTransformacoes() {
  const hover = useStore((s) => s.ui.hover);
  const cor = useStore((s) => s.ui.corAtual);
  const sessaoAtiva = useStore((s) => s.depuracao.sessao?.algoritmoId === algoritmoTransformacao.id);
  const adicionarObjeto = useStore((s) => s.adicionarObjeto);
  const selecionarPorRegiao = useStore((s) => s.selecionarPorRegiao);
  const limparSelecao = useStore((s) => s.limparSelecao);
  const encerrarDepuracao = useStore((s) => s.encerrarDepuracao);
  const definirModoOrigem = useStore((s) => s.definirModoOrigem);
  const selecionados = useObjetosSelecionados();

  const [tipoFerramenta, setTipoFerramenta] = useState<TipoFerramenta>('poligono');
  const [valores, setValores] = useState<ValoresTransformacao>(VALORES_INICIAIS);
  const [modoPivo, setModoPivo] = useState<ModoPivo>('origem');
  const [pivoClicado, setPivoClicado] = useState<Ponto | null>(null);
  const [definindoPivo, setDefinindoPivo] = useState(false);
  const [idsSessao, setIdsSessao] = useState<string[]>([]);
  /** Matriz e pivô efetivamente usados no último "Aplicar" (o centroide some com a seleção). */
  const [usada, setUsada] = useState<{ montada: MatrizMontada; pivo: Ponto } | null>(null);
  const [aviso, setAviso] = useState<string | undefined>();

  // Reflexões/rotações em torno da origem geram coordenadas negativas: origem no centro da grade.
  useEffect(() => {
    definirModoOrigem('centro');
  }, [definirModoOrigem]);

  // ----- Ferramentas de desenho e seleção -------------------------------------------------------
  const poligono = useFerramentaPoligono({
    hover,
    cor,
    aoConcluir(vertices) {
      adicionarObjeto(criarPoligono(vertices, cor));
    },
  });
  const reta = useFerramentaReta({
    hover,
    cor,
    aoConcluir(p1, p2) {
      adicionarObjeto(criarReta(p1, p2, cor, 'bresenham'));
    },
  });
  const ponto = useFerramentaPonto({
    aoConcluir(p) {
      adicionarObjeto(criarPonto(p, cor));
    },
  });
  const selecao = useFerramentaSelecao({ aoSelecionar: selecionarPorRegiao });
  const pivoFerramenta = useFerramentaPivo({
    aoConcluir(p) {
      setPivoClicado(p);
      setDefinindoPivo(false);
    },
  });

  const usaPivo = valores.tipo !== 'translacao';
  const ferramentas: Record<TipoFerramenta, Ferramenta> = { poligono, reta, ponto, selecao };
  let ferramenta: Ferramenta;
  if (sessaoAtiva) ferramenta = { ...FERRAMENTA_INATIVA, instrucao: 'Acompanhe a transformação e depois Confirme ou Cancele' };
  else if (usaPivo && definindoPivo) ferramenta = pivoFerramenta;
  else ferramenta = ferramentas[tipoFerramenta];

  function trocarFerramenta(t: TipoFerramenta): void {
    ferramentas[tipoFerramenta].cancelar();
    setDefinindoPivo(false);
    setTipoFerramenta(t);
  }

  // ----- Pivô e matriz --------------------------------------------------------------------------
  let pivo: Ponto | null;
  if (modoPivo === 'origem') pivo = { x: 0, y: 0 };
  else if (modoPivo === 'centroide') pivo = selecionados.length > 0 ? centroide(selecionados.flatMap(verticesDe)) : null;
  else pivo = pivoClicado;

  function trocarModoPivo(m: ModoPivo): void {
    setModoPivo(m);
    // "Clique na grade" sem pivô ainda escolhido: a próxima célula clicada vira o pivô.
    setDefinindoPivo(m === 'clique' && pivoClicado === null);
  }

  const pivoX = pivo?.x ?? 0;
  const pivoY = pivo?.y ?? 0;
  const temPivo = pivo !== null;
  const previa = useMemo(() => montarMatriz(paraTransformacao(valores), { x: pivoX, y: pivoY }), [valores, pivoX, pivoY]);
  // Durante a sessão mostra a matriz que foi de fato aplicada (o centroide some com a seleção).
  const montada = sessaoAtiva && usada ? usada.montada : previa;

  // Prévia tracejada do resultado + marcador do pivô (a sessão desenha os seus próprios).
  const overlays = useMemo<Overlay[]>(() => {
    if (sessaoAtiva) return [];
    const lista: Overlay[] = [];
    if (temPivo || !usaPivo) {
      for (const obj of selecionados) lista.push(...contornoObjeto(transformarObjeto(obj, previa.matriz), COR_OVERLAY.candidato));
    }
    if (usaPivo && temPivo) lista.push({ tipo: 'ponto-real', x: pivoX, y: pivoY, cor: COR_OVERLAY.selecao, rotulo: 'pivô' });
    return lista;
  }, [sessaoAtiva, selecionados, previa, usaPivo, temPivo, pivoX, pivoY]);

  // ----- Ações ---------------------------------------------------------------------------------
  const podeAplicar = !sessaoAtiva && selecionados.length > 0 && (!usaPivo || pivo !== null);

  function aplicar(): void {
    if (!podeAplicar) return;
    const objetos = selecionados;
    const ids = objetos.map((o) => o.id);
    const pivoUsado = pivo ?? { x: 0, y: 0 };
    const m = montarMatriz(paraTransformacao(valores), pivoUsado);
    // O realce de seleção desenharia os objetos originais (ocultos) durante a sessão: limpa e
    // restaura ao Confirmar (as cópias transformadas continuam com `selecionado = true`) ou Cancelar.
    limparSelecao();
    const erro = executarAlgoritmo(
      algoritmoTransformacao,
      {
        objetos,
        matriz: m.matriz,
        composicao: m.composicao,
        fatores: m.fatores,
        ...(usaPivo ? { pivo: pivoUsado } : {}),
      },
      { cor, ocultos: ids },
    );
    setIdsSessao(ids);
    setUsada({ montada: m, pivo: pivoUsado });
    setAviso(erro ?? undefined);
    if (erro) restaurarSelecao(ids);
  }

  function restaurarSelecao(ids: readonly string[]): void {
    const estado = useStore.getState();
    for (const id of ids) {
      const obj = estado.cena.objetos.find((o) => o.id === id);
      if (obj && !obj.selecionado) useStore.getState().alternarSelecao(id);
    }
  }

  function confirmar(): void {
    const sessao = useStore.getState().depuracao.sessao;
    if (!sessao || sessao.algoritmoId !== algoritmoTransformacao.id) return;
    const resultado = sessao.resultado as ResultadoTransformacao;
    // Restaura a seleção antes de gravar: o snapshot do histórico (Desfazer) mantém os objetos selecionados.
    restaurarSelecao(idsSessao);
    useStore.getState().substituirObjetos(resultado.objetos);
    encerrarDepuracao();
    setIdsSessao([]);
  }

  function cancelar(): void {
    encerrarDepuracao();
    restaurarSelecao(idsSessao);
    setIdsSessao([]);
  }

  // ----- Painel --------------------------------------------------------------------------------
  let passoAtual = 0;
  if (sessaoAtiva) passoAtual = 4;
  else if (selecionados.length > 0) passoAtual = 2;
  else if (tipoFerramenta === 'selecao') passoAtual = 1;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={PASSOS_INSTRUCAO} atual={passoAtual} />
      </section>

      <section className="pilha">
        <h3 className="secao__titulo">Ferramenta</h3>
        <BotoesSegmentados
          opcoes={OPCOES_FERRAMENTA.map((o) => ({ ...o, desabilitada: sessaoAtiva }))}
          valor={tipoFerramenta}
          onChange={trocarFerramenta}
          compacto
          rotulo="Ferramenta"
        />
        {tipoFerramenta === 'poligono' && (
          <div className="linha">
            <Botao pequeno disabled={sessaoAtiva || !poligono.podeFechar} onClick={poligono.fechar} title="Fecha o polígono ligando o último vértice ao primeiro">
              Fechar polígono
            </Botao>
            <Botao pequeno disabled={sessaoAtiva || poligono.verticesAtuais.length === 0} onClick={poligono.cancelar} title="Descarta os vértices já clicados">
              Descartar vértices
            </Botao>
          </div>
        )}
        {tipoFerramenta === 'reta' && reta.p1 && (
          <div className="linha">
            <Botao pequeno onClick={reta.cancelar} title="Descarta o P1 já fixado">
              Cancelar P1
            </Botao>
          </div>
        )}
        <div className="linha">
          <span className="texto-pequeno">
            {selecionados.length === 0
              ? sessaoAtiva
                ? `${idsSessao.length} objeto(s) em transformação`
                : 'Nenhum objeto selecionado'
              : `Selecionados: ${selecionados.map((o) => o.nome).join(', ')}`}
          </span>
          {selecionados.length > 0 && !sessaoAtiva && (
            <Botao pequeno onClick={limparSelecao} title="Desmarca todos os objetos">
              Limpar seleção
            </Botao>
          )}
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Transformação</h3>
        <PainelTransformacao
          valores={valores}
          onValores={setValores}
          modoPivo={modoPivo}
          onModoPivo={trocarModoPivo}
          pivo={!usaPivo ? null : sessaoAtiva && usada ? usada.pivo : pivo}
          definindoPivo={usaPivo && definindoPivo}
          onDefinirPivo={() => setDefinindoPivo(true)}
          disabled={sessaoAtiva}
        />
      </section>

      <section className="pilha">
        <h3 className="secao__titulo">Matriz composta</h3>
        <span className="texto-pequeno">M = {montada.expressao}</span>
        <ValorVariavel valor={paraValor(montada.matriz, 'M')} />
        <div className="linha">
          <Botao variante="primario" pequeno disabled={!podeAplicar} onClick={aplicar} title="Transforma os objetos selecionados passo a passo">
            Aplicar
          </Botao>
          <Botao pequeno disabled={!sessaoAtiva} onClick={confirmar} title="Grava os objetos transformados na cena">
            Confirmar
          </Botao>
          <Botao pequeno disabled={!sessaoAtiva} onClick={cancelar} title="Descarta a transformação">
            Cancelar
          </Botao>
        </div>
        {!sessaoAtiva && selecionados.length > 0 && (
          <span className="texto-pequeno texto-suave">O contorno tracejado cinza sobre a grade é a prévia do resultado.</span>
        )}
        {!sessaoAtiva && selecionados.length === 0 && (
          <span className="texto-pequeno texto-suave">Selecione ao menos um objeto para aplicar.</span>
        )}
        {!sessaoAtiva && selecionados.length > 0 && usaPivo && pivo === null && (
          <span className="texto-pequeno texto-suave">Clique na grade para definir o pivô.</span>
        )}
        {sessaoAtiva && (
          <span className="texto-pequeno texto-suave">
            Use os controles abaixo da grade para andar pelos passos; o resultado só entra na cena ao Confirmar.
          </span>
        )}
      </section>
    </>
  );

  return <ModuloConectado painel={painel} ferramenta={ferramenta} overlays={overlays} regiaoArrasto={tipoFerramenta === 'selecao' ? selecao.regiaoAtual : null} aviso={aviso} />;
}
