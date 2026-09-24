/**
 * Módulo "Circunferência - Bresenham" (slides "CG 06 Circ").
 *
 * Fluxo: 1º clique fixa o centro (preview da circunferência ideal até o mouse), 2º clique fixa o
 * raio → a circunferência entra na cena e a depuração começa. O slider "Raio" altera a última
 * circunferência e reexecuta o algoritmo (com um pequeno atraso, para não recalcular a cada
 * movimento do arrasto).
 */
import { useEffect, useState } from 'react';
import type { Ponto } from '../../core/tipos';
import { algoritmoBresenhamCirculo, type ParametrosCirculo } from '../../core/rasterizacao/bresenhamCirculo';
import { criarCirculo, type ObjetoCirculo } from '../../core/cena/objetos';
import { formatarNumero } from '../../core/geometria';
import { useStore } from '../../estado/store';
import { useFerramentaCirculo } from '../../ferramentas/useFerramentaCirculo';
import { ModuloConectado } from '../../componentes/conectados/ModuloConectado';
import { Botao } from '../../componentes/controles/Botao';
import { Instrucoes } from '../../componentes/controles/Instrucoes';
import { Slider } from '../../componentes/controles/Slider';
import { executarAlgoritmo } from '../comum/executar';

interface UltimoCirculo {
  id: string;
  centro: Ponto;
  raio: number;
}

const PASSOS_INSTRUCAO = [
  'Clique no centro C',
  'Clique num ponto da circunferência para definir o raio',
  'Acompanhe a execução; ajuste o raio no slider para reexecutar',
];

const RAIO_MAX = 40;
/** Atraso (ms) entre soltar o slider e reexecutar o algoritmo. */
const ATRASO_SLIDER = 150;

export function ModuloBresenhamCirculo() {
  const hover = useStore((s) => s.ui.hover);
  const cor = useStore((s) => s.ui.corAtual);
  const sessaoAtiva = useStore((s) => s.depuracao.sessao !== null);
  const adicionarObjeto = useStore((s) => s.adicionarObjeto);
  const substituirObjetos = useStore((s) => s.substituirObjetos);
  const encerrarDepuracao = useStore((s) => s.encerrarDepuracao);

  const [ultimo, setUltimo] = useState<UltimoCirculo | null>(null);
  const [raioSlider, setRaioSlider] = useState(5);
  const [aviso, setAviso] = useState<string | undefined>();
  // A circunferência pode ter sido removida (Desfazer, Limpar, aba Objetos).
  const ultimoExiste = useStore((s) => ultimo !== null && s.cena.objetos.some((o) => o.id === ultimo.id));

  function executar(c: UltimoCirculo, corExecucao: string): void {
    const params: ParametrosCirculo = { xc: c.centro.x, yc: c.centro.y, r: c.raio };
    setAviso(executarAlgoritmo(algoritmoBresenhamCirculo, params, { cor: corExecucao, ocultos: [c.id] }) ?? undefined);
  }

  function objetoAtual(id: string): ObjetoCirculo | undefined {
    const obj = useStore.getState().cena.objetos.find((o) => o.id === id);
    return obj?.tipo === 'circulo' ? obj : undefined;
  }

  const circulo = useFerramentaCirculo({
    hover,
    cor,
    aoConcluir(centro, raio) {
      const id = adicionarObjeto(criarCirculo(centro, raio, cor));
      const c: UltimoCirculo = { id, centro, raio };
      setUltimo(c);
      setRaioSlider(raio);
      executar(c, cor);
    },
  });

  // Slider de raio: atualiza a circunferência na cena e reexecuta, após um pequeno atraso.
  useEffect(() => {
    if (!ultimo || raioSlider === ultimo.raio) return undefined;
    const timer = setTimeout(() => {
      const obj = objetoAtual(ultimo.id);
      if (!obj) return;
      substituirObjetos([{ ...obj, raio: raioSlider }]);
      const c: UltimoCirculo = { ...ultimo, raio: raioSlider };
      setUltimo(c);
      executar(c, obj.cor);
    }, ATRASO_SLIDER);
    return () => clearTimeout(timer);
    // `executar` e `objetoAtual` ficam fora das dependências: só leem o store no momento da chamada.
  }, [raioSlider, ultimo, substituirObjetos]);

  function repetir(): void {
    if (!ultimo) return;
    const obj = objetoAtual(ultimo.id);
    if (obj) executar(ultimo, obj.cor);
  }

  const passoAtual = circulo.centro ? 1 : sessaoAtiva ? 2 : 0;

  const painel = (
    <>
      <section>
        <h3 className="secao__titulo">Como usar</h3>
        <Instrucoes passos={PASSOS_INSTRUCAO} atual={passoAtual} />
      </section>

      <section>
        <h3 className="secao__titulo">Última circunferência</h3>
        {ultimo ? (
          <p className="texto-pequeno">
            C = ({formatarNumero(ultimo.centro.x)}, {formatarNumero(ultimo.centro.y)}) · r = {ultimo.raio}
          </p>
        ) : (
          <p className="texto-suave texto-pequeno">Nenhuma circunferência desenhada neste módulo.</p>
        )}
        <div className="pilha">
          <Slider
            rotulo="Raio"
            valor={raioSlider}
            min={0}
            max={RAIO_MAX}
            onChange={setRaioSlider}
            disabled={!ultimoExiste}
            presets={[
              { rotulo: '0', valor: 0 },
              { rotulo: '1', valor: 1 },
              { rotulo: '5', valor: 5 },
              { rotulo: '12', valor: 12 },
            ]}
          />
          <div className="linha">
            <Botao variante="primario" pequeno disabled={!ultimoExiste} onClick={repetir} title="Executa de novo o algoritmo sobre a última circunferência">
              Nova execução
            </Botao>
            <Botao pequeno disabled={!sessaoAtiva} onClick={encerrarDepuracao} title="Encerra a depuração e mantém a circunferência na cena">
              Encerrar
            </Botao>
            <Botao pequeno disabled={circulo.centro === null} onClick={circulo.cancelar} title="Descarta o centro já fixado">
              Cancelar centro
            </Botao>
          </div>
        </div>
      </section>

      <section>
        <h3 className="secao__titulo">Sobre o algoritmo</h3>
        <p className="texto-pequeno">
          Calcula só o arco de 45° entre x = 0 e x = y; cada ponto é espelhado nos 8 octantes por{' '}
          <code>plot_circle_points</code>. A decisão <code>p</code> começa em <code>3 − 2r</code>: se <code>p &lt; 0</code> o y
          se mantém, senão y decresce.
        </p>
      </section>
    </>
  );

  return <ModuloConectado painel={painel} ferramenta={circulo} aviso={aviso} />;
}
