/**
 * Aba "Objetos": lista dos objetos da cena com tipo, nome, cor, resumo das coordenadas,
 * estado de seleção (clique na linha alterna) e botão de remoção.
 */
import type { ObjetoGrafico } from '../../core/cena/objetos';
import { formatarNumero } from '../../core/geometria';
import { nomeDaCor } from '../../core/cores';
import type { Ponto } from '../../core/tipos';
import { ICONES_OBJETO, IconeFechar, IconeMarca } from '../icones';
import { Botao } from '../controles/Botao';
import './depurador.css';

export interface AbaObjetosProps {
  objetos: ObjetoGrafico[];
  onAlternarSelecao(id: string): void;
  onRemover(id: string): void;
  onLimparSelecao(): void;
}

function fmtPonto(p: Ponto): string {
  return `(${formatarNumero(p.x)}, ${formatarNumero(p.y)})`;
}

/** Resumo curto das coordenadas de um objeto. */
export function resumirObjeto(obj: ObjetoGrafico): string {
  switch (obj.tipo) {
    case 'ponto':
      return fmtPonto(obj.p);
    case 'reta':
      return `${fmtPonto(obj.p1)} → ${fmtPonto(obj.p2)} · ${obj.rasterizador === 'dda' ? 'DDA' : 'Bresenham'}`;
    case 'poligono': {
      const mostrados = obj.vertices.slice(0, 3).map(fmtPonto).join(' ');
      const resto = obj.vertices.length > 3 ? ' …' : '';
      return `${obj.vertices.length} vértices: ${mostrados}${resto}`;
    }
    case 'circulo':
      return `C = ${fmtPonto(obj.centro)} · r = ${formatarNumero(obj.raio)}`;
    case 'preenchimento':
      return `${obj.pixels.length} pixels`;
  }
}

export function AbaObjetos({ objetos, onAlternarSelecao, onRemover, onLimparSelecao }: AbaObjetosProps) {
  const selecionados = objetos.filter((o) => o.selecionado).length;

  return (
    <div className="aba-objetos">
      <div className="aba-objetos__cabecalho">
        <span>
          {objetos.length === 0
            ? 'Nenhum objeto'
            : `${objetos.length} ${objetos.length === 1 ? 'objeto' : 'objetos'} · ${selecionados} ${selecionados === 1 ? 'selecionado' : 'selecionados'}`}
        </span>
        <Botao pequeno disabled={selecionados === 0} onClick={onLimparSelecao} title="Desmarcar todos os objetos">
          Limpar seleção
        </Botao>
      </div>

      {objetos.length === 0 ? (
        <div className="vazio">Nenhum objeto na cena</div>
      ) : (
        <ul className="aba-objetos__lista">
          {objetos.map((obj) => {
            const { Icone, rotulo } = ICONES_OBJETO[obj.tipo];
            return (
              <li key={obj.id} className={'aba-objetos__item' + (obj.selecionado ? ' aba-objetos__item--selecionado' : '')}>
                <button
                  type="button"
                  className="aba-objetos__alternar"
                  aria-pressed={obj.selecionado}
                  title={obj.selecionado ? 'Clique para desmarcar' : 'Clique para selecionar'}
                  onClick={() => onAlternarSelecao(obj.id)}
                >
                  <span className="aba-objetos__marca" aria-hidden="true">
                    {obj.selecionado && <IconeMarca tamanho={12} />}
                  </span>
                  <span className="aba-objetos__icone" title={rotulo}>
                    <Icone />
                  </span>
                  <span className="aba-objetos__nome">
                    <span className="aba-objetos__cor" style={{ background: obj.cor }} title={nomeDaCor(obj.cor)} />
                    {obj.nome}
                    <span className="aba-objetos__tipo">{rotulo}</span>
                  </span>
                  <span className="aba-objetos__resumo" title={resumirObjeto(obj)}>
                    {resumirObjeto(obj)}
                  </span>
                </button>
                <button
                  type="button"
                  className="aba-objetos__remover"
                  title={`Remover ${obj.nome}`}
                  aria-label={`Remover ${obj.nome}`}
                  onClick={() => onRemover(obj.id)}
                >
                  <IconeFechar tamanho={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
