/**
 * Painel direito com as abas Código / Variáveis / Objetos. Só a aba ativa é montada; o conteúdo
 * tem rolagem própria.
 */
import type { ReactNode } from 'react';
import './layout.css';

export type AbaPainelDireito = 'codigo' | 'variaveis' | 'objetos';

export interface PainelDireitoProps {
  aba: AbaPainelDireito;
  onMudarAba(aba: AbaPainelDireito): void;
  codigo: ReactNode;
  variaveis: ReactNode;
  objetos: ReactNode;
}

const ABAS: ReadonlyArray<{ id: AbaPainelDireito; rotulo: string }> = [
  { id: 'codigo', rotulo: 'Código' },
  { id: 'variaveis', rotulo: 'Variáveis' },
  { id: 'objetos', rotulo: 'Objetos' },
];

export function PainelDireito({ aba, onMudarAba, codigo, variaveis, objetos }: PainelDireitoProps) {
  const conteudo = aba === 'codigo' ? codigo : aba === 'variaveis' ? variaveis : objetos;
  return (
    <div className="painel-direito">
      <div className="painel-direito__abas" role="tablist">
        {ABAS.map((a) => {
          const ativa = a.id === aba;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              id={`aba-${a.id}`}
              aria-selected={ativa}
              aria-controls={`painel-${a.id}`}
              className={'painel-direito__aba' + (ativa ? ' painel-direito__aba--ativa' : '')}
              onClick={() => {
                if (!ativa) onMudarAba(a.id);
              }}
            >
              {a.rotulo}
            </button>
          );
        })}
      </div>
      <div className="painel-direito__conteudo" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {conteudo}
      </div>
    </div>
  );
}
