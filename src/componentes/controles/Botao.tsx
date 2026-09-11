/**
 * Botão padrão da interface. Aceita todas as props de `<button>`; `type` é "button" por padrão
 * para nunca submeter formulários por acidente.
 */
import type { ButtonHTMLAttributes } from 'react';
import './controles.css';

export type VarianteBotao = 'primario' | 'secundario' | 'perigo';

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  pequeno?: boolean;
  /** Para botões de alternância: quando `true`, exibe o estado "ligado" (e `aria-pressed`). */
  ativo?: boolean;
}

export function Botao({ variante = 'secundario', pequeno = false, ativo, className, type = 'button', children, ...resto }: BotaoProps) {
  const classes = ['botao', `botao--${variante}`, pequeno && 'botao--pequeno', ativo && 'botao--ativo', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} aria-pressed={ativo} {...resto}>
      {children}
    </button>
  );
}
