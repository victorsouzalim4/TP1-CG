/**
 * Aba "Código": listagem do algoritmo com numeração, linha atual destacada (fundo amarelo suave)
 * e rolagem automática até ela. A `descricao` do passo aparece num rodapé fixo.
 */
import { useEffect, useMemo, useRef } from 'react';
import './depurador.css';

export interface AbaCodigoProps {
  /** Listagem completa (linhas separadas por '\n'). Vazia: exibe "Nenhum algoritmo em execução". */
  codigo: string;
  /** Linha em execução (1-based) ou `null`. */
  linhaAtual: number | null;
  /** Frase curta do passo atual, exibida no rodapé. */
  descricao?: string;
  /** Nome do algoritmo, exibido acima da listagem. */
  titulo?: string;
}

export function AbaCodigo({ codigo, linhaAtual, descricao, titulo }: AbaCodigoProps) {
  const linhas = useMemo(() => (codigo.length === 0 ? [] : codigo.split('\n')), [codigo]);
  const linhaAtualRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    linhaAtualRef.current?.scrollIntoView({ block: 'nearest' });
  }, [linhaAtual, codigo]);

  if (linhas.length === 0) {
    return (
      <div className="aba-codigo">
        <div className="vazio">Nenhum algoritmo em execução</div>
      </div>
    );
  }

  return (
    <div className="aba-codigo">
      {titulo && <div className="aba-codigo__titulo">{titulo}</div>}
      <pre className="aba-codigo__listagem" aria-label="Listagem do algoritmo">
        {linhas.map((texto, i) => {
          const numero = i + 1;
          const atual = numero === linhaAtual;
          return (
            <span
              key={numero}
              ref={atual ? linhaAtualRef : undefined}
              className={'aba-codigo__linha' + (atual ? ' aba-codigo__linha--atual' : '')}
              aria-current={atual ? 'step' : undefined}
            >
              <span className="aba-codigo__numero">{numero}</span>
              <span className="aba-codigo__texto">{texto.length === 0 ? ' ' : texto}</span>
            </span>
          );
        })}
      </pre>
      <div className="aba-codigo__rodape" aria-live="polite">
        {descricao ?? ''}
      </div>
    </div>
  );
}
