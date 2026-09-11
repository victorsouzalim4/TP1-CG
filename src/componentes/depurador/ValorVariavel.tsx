/**
 * Renderiza um `Valor` do painel de variáveis de acordo com o seu tipo:
 * número (formatarNumero), string, boolean ("Verdade"/"Falso"), null ("—"), ponto "(x, y)",
 * bits (com rótulo por bit e o decimal), matriz (tabela entre colchetes), pilha, tabela e lista.
 */
import { Fragment } from 'react';
import type { Valor } from '../../core/tipos';
import { formatarNumero } from '../../core/geometria';
import './depurador.css';

export interface ValorVariavelProps {
  valor: Valor;
}

export function ValorVariavel({ valor }: ValorVariavelProps) {
  if (valor === null) return <span className="valor valor--nulo">—</span>;
  if (typeof valor === 'number') return <span className="valor valor--numero">{formatarNumero(valor)}</span>;
  if (typeof valor === 'string') return <span className="valor valor--texto">{valor}</span>;
  if (typeof valor === 'boolean') {
    return <span className={'valor valor--booleano ' + (valor ? 'valor--verdade' : 'valor--falso')}>{valor ? 'Verdade' : 'Falso'}</span>;
  }

  switch (valor.tipo) {
    case 'ponto':
      return (
        <span className="valor valor--ponto">
          ({formatarNumero(valor.x)}, {formatarNumero(valor.y)})
        </span>
      );

    case 'bits': {
      const n = Math.max(valor.rotulos.length, 1);
      const binario = Math.max(0, Math.trunc(valor.valor)).toString(2).padStart(n, '0');
      // Os rótulos vão do bit mais significativo ao menos; alinhamos pela direita.
      const bits = binario.split('');
      const deslocamento = bits.length - valor.rotulos.length;
      return (
        <span className="valor valor-bits">
          <table className="valor-bits__tabela">
            <tbody>
              {valor.rotulos.length > 0 && (
                <tr>
                  {bits.map((_, i) => (
                    <td key={i} className="valor-bits__rotulo">
                      {i >= deslocamento ? valor.rotulos[i - deslocamento] : ''}
                    </td>
                  ))}
                </tr>
              )}
              <tr>
                {bits.map((b, i) => (
                  <td key={i} className={'valor-bits__bit' + (b === '1' ? ' valor-bits__bit--um' : '')}>
                    {b}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <span className="valor-bits__decimal">= {formatarNumero(valor.valor)}</span>
        </span>
      );
    }

    case 'matriz':
      return (
        <span className="valor valor-matriz">
          {valor.rotulo && <span className="valor-matriz__rotulo">{valor.rotulo} =</span>}
          <table className="valor-matriz__tabela">
            <tbody>
              {valor.linhas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((v, j) => (
                    <td key={j}>{formatarNumero(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </span>
      );

    case 'pilha': {
      const ocultos = valor.tamanho - valor.topo.length;
      return (
        <span className="valor valor-pilha">
          <span className="valor-pilha__tamanho">tamanho {valor.tamanho}</span>
          {valor.topo.length > 0 && (
            <ol className="valor-pilha__itens">
              {valor.topo.map((item, i) => (
                <li key={i} className={'valor-pilha__item' + (i === 0 ? ' valor-pilha__item--topo' : '')}>
                  <ValorVariavel valor={item} />
                </li>
              ))}
              {ocultos > 0 && <li className="valor-pilha__resto">… mais {ocultos}</li>}
            </ol>
          )}
        </span>
      );
    }

    case 'tabela':
      return (
        <table className="valor valor-tabela">
          <thead>
            <tr>
              {valor.colunas.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valor.linhas.map((linha, i) => (
              <tr key={i}>
                {linha.map((v, j) => (
                  <td key={j}>
                    <ValorVariavel valor={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'lista':
      if (valor.itens.length === 0) return <span className="valor valor--nulo">(vazia)</span>;
      return (
        <span className="valor valor-lista">
          {valor.itens.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && ', '}
              <ValorVariavel valor={item} />
            </Fragment>
          ))}
        </span>
      );
  }
}
