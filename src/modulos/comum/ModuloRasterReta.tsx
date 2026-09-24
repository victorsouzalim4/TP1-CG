/**
 * Módulo de rasterização de retas, compartilhado por DDA e Bresenham (a interação é a mesma;
 * muda só o algoritmo executado).
 *
 * Fluxo: 1º clique fixa P1 (preview tracejado até o mouse), 2º clique fixa P2 → a reta entra na
 * cena e a depuração começa, com a reta oculta da camada base para ser pintada passo a passo.
 */
import { useState, type ReactNode } from 'react';
import type { Algoritmo, Ponto } from '../../core/tipos';
import type { ParametrosReta, ResultadoRasterizacao } from '../../core/rasterizacao/dda';
import { criarReta } from '../../core/cena/objetos';
import { formatarNumero } from '../../core/geometria';
import { useStore } from '../../estado/store';
import { useFerramentaReta } from '../../ferramentas/useFerramentaReta';
import { ModuloConectado } from '../../componentes/conectados/ModuloConectado';
import { Botao } from '../../componentes/controles/Botao';
import { Instrucoes } from '../../componentes/controles/Instrucoes';
import { executarAlgoritmo } from './executar';

export interface ModuloRasterRetaProps {
  rasterizador: 'dda' | 'bresenham';
  algoritmo: Algoritmo<ParametrosReta, ResultadoRasterizacao>;
  /** Texto curto sobre o algoritmo, exibido no painel. */
  sobre: ReactNode;
}

interface UltimaReta {
  id: string;
  params: ParametrosReta;
}

const PASSOS_INSTRUCAO = ['Clique no ponto inicial P1', 'Clique no ponto final P2', 'Acompanhe a execução com os controles abaixo da grade'];

function fmt(p: Ponto): string {
  return `(${formatarNumero(p.x)}, ${formatarNumero(p.y)})`;
}

export function ModuloRasterReta({ rasterizador, algoritmo, sobre }: ModuloRasterRetaProps) {
  const hover = useStore((s) => s.ui.hover);
  const cor = useStore((s) => s.ui.corAtual);
  const sessaoAtiva = useStore((s) => s.depuracao.sessao !== null);
  const adicionarObjeto = useStore((s) => s.adicionarObjeto);
  const encerrarDepuracao = useStore((s) => s.encerrarDepuracao);

  const [ultima, setUltima] = useState<UltimaReta | null>(null);
  const [aviso, setAviso] = useState<string | undefined>();
  // A reta pode ter sido removida (Desfazer, Limpar, aba Objetos): aí não dá para repetir.
  const ultimaExiste = useStore((s) => ultima !== null && s.cena.objetos.some((o) => o.id === ultima.id));

  function executar(r: UltimaReta, corExecucao: string): void {
    setAviso(executarAlgoritmo(algoritmo, r.params, { cor: corExecucao, ocultos: [r.id] }) ?? undefined);
  }

  const reta = useFerramentaReta({
    hover,
    cor,
    aoConcluir(p1, p2) {
      const id = adicionarObjeto(criarReta(p1, p2, cor, rasterizador));
      const r: UltimaReta = { id, params: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } };
      setUltima(r);
      executar(r, cor);
    },
  });

  function repetir(): void {
    if (!ultima) return;
    const obj = useStore.getState().cena.objetos.find((o) => o.id === ultima.id);
    if (obj) executar(ultima, obj.cor);
  }

  const passoAtual = reta.p1 ? 1 : sessaoAtiva ? 2 : 0;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={PASSOS_INSTRUCAO} atual={passoAtual} />
      </section>

      <section>
        <h3 className="secao__titulo">Última reta</h3>
        {ultima ? (
          <p className="texto-pequeno">
            P1 = {fmt({ x: ultima.params.x1, y: ultima.params.y1 })} → P2 = {fmt({ x: ultima.params.x2, y: ultima.params.y2 })}
          </p>
        ) : (
          <p className="texto-suave texto-pequeno">Nenhuma reta desenhada neste módulo.</p>
        )}
        <div className="linha">
          <Botao variante="primario" pequeno disabled={!ultimaExiste} onClick={repetir} title="Executa de novo o algoritmo sobre a última reta">
            Nova execução
          </Botao>
          <Botao pequeno disabled={!sessaoAtiva} onClick={encerrarDepuracao} title="Encerra a depuração e mantém a reta na cena">
            Encerrar
          </Botao>
          <Botao pequeno disabled={reta.p1 === null} onClick={reta.cancelar} title="Descarta o P1 já fixado">
            Cancelar P1
          </Botao>
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Sobre o algoritmo</h3>
        <div className="texto-pequeno">{sobre}</div>
      </section>
    </>
  );

  return <ModuloConectado painel={painel} ferramenta={reta} aviso={aviso} />;
}
