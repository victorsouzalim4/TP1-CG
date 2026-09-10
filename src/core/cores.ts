/**
 * Paleta de cores do simulador (todas as escolhas de cor são feitas por clique na paleta).
 */

export interface CorPaleta {
  nome: string;
  hex: string;
}

/** As 8 cores clicáveis da paleta. */
export const PALETA: readonly CorPaleta[] = [
  { nome: 'Preto', hex: '#111827' },
  { nome: 'Vermelho', hex: '#dc2626' },
  { nome: 'Verde', hex: '#16a34a' },
  { nome: 'Azul', hex: '#2563eb' },
  { nome: 'Laranja', hex: '#ea580c' },
  { nome: 'Roxo', hex: '#7c3aed' },
  { nome: 'Ciano', hex: '#0891b2' },
  { nome: 'Cinza', hex: '#6b7280' },
];

/** Cor de fundo das células vazias da matriz de pixels. */
export const COR_FUNDO = '#ffffff';

/** Valor devolvido por `inquirir_cor` fora dos limites da grade (funciona como contorno para os fills). */
export const COR_FORA = '__fora__';

/** Cor usada quando um pixel não informa cor (cor padrão de desenho). */
export const COR_PADRAO = PALETA[0].hex;

/** Cores de apoio usadas em overlays (não fazem parte da paleta do usuário). */
export const COR_OVERLAY = {
  destaque: '#f59e0b',
  candidato: '#94a3b8',
  selecao: '#3b82f6',
  janela: '#ef4444',
  ideal: '#64748b',
  pilha: '#fde68a',
} as const;

/** Nome legível de uma cor da paleta (ou o próprio hex se não estiver na paleta). */
export function nomeDaCor(hex: string): string {
  if (hex === COR_FUNDO) return 'Fundo';
  if (hex === COR_FORA) return 'Fora da grade';
  return PALETA.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.nome ?? hex;
}
