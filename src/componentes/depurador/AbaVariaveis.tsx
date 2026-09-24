/**
 * Aba "Variáveis": tabela nome/valor do passo atual. As variáveis em `alteradas` recebem fundo
 * azul-claro (com transição), para o olho acompanhar o que mudou entre passos.
 */
import { Fragment } from 'react';
import type { Variaveis } from '../../core/tipos';
import { ValorVariavel } from './ValorVariavel';
import './depurador.css';

export interface AbaVariaveisProps {
  variaveis: Variaveis;
  /** Nomes das variáveis que mudaram em relação ao passo anterior. */
  alteradas?: Set<string>;
}

export function AbaVariaveis({ variaveis, alteradas }: AbaVariaveisProps) {
  const nomes = Object.keys(variaveis);
  if (nomes.length === 0) return <div className="vazio">Sem variáveis</div>;

  return (
    <table className="aba-variaveis">
      <tbody>
        {nomes.map((nome) => {
          const alterada = alteradas?.has(nome) ?? false;
          const classe = 'aba-variaveis__linha' + (alterada ? ' aba-variaveis__linha--alterada' : '');
          const valor = variaveis[nome];
          // Tabelas têm muitas colunas: o nome fica numa linha e o valor usa a largura toda na seguinte.
          if (typeof valor === 'object' && valor !== null && valor.tipo === 'tabela') {
            return (
              <Fragment key={nome}>
                <tr className={classe + ' aba-variaveis__linha--larga'}>
                  <th scope="row" colSpan={2}>
                    {nome}
                  </th>
                </tr>
                <tr className={classe}>
                  <td colSpan={2}>
                    <ValorVariavel valor={valor} />
                  </td>
                </tr>
              </Fragment>
            );
          }
          return (
            <tr key={nome} className={classe}>
              <th scope="row">{nome}</th>
              <td>
                <ValorVariavel valor={valor} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
