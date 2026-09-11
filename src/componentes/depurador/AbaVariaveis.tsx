/**
 * Aba "Variáveis": tabela nome/valor do passo atual. As variáveis em `alteradas` recebem fundo
 * azul-claro (com transição), para o olho acompanhar o que mudou entre passos.
 */
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
          return (
            <tr key={nome} className={'aba-variaveis__linha' + (alterada ? ' aba-variaveis__linha--alterada' : '')}>
              <th scope="row">{nome}</th>
              <td>
                <ValorVariavel valor={variaveis[nome]} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
