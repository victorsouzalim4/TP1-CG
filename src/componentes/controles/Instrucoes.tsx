/**
 * Lista numerada de instruções para o usuário; o passo `atual` fica em destaque e os anteriores
 * aparecem riscados.
 */
import './controles.css';

export interface InstrucoesProps {
  passos: string[];
  /** Índice (0-based) do passo em andamento. Omitido: nenhum destaque. */
  atual?: number;
}

export function Instrucoes({ passos, atual }: InstrucoesProps) {
  return (
    <ol className="instrucoes">
      {passos.map((texto, i) => {
        const classe =
          'instrucoes__passo' +
          (atual !== undefined && i === atual ? ' instrucoes__passo--atual' : '') +
          (atual !== undefined && i < atual ? ' instrucoes__passo--concluido' : '');
        return (
          <li key={i} className={classe} aria-current={atual === i ? 'step' : undefined}>
            {texto}
          </li>
        );
      })}
    </ol>
  );
}
