/**
 * Reprodução automática da depuração: enquanto `executando` for verdadeiro, avança um passo a
 * cada `1000 / velocidade` ms. Deve ser montado UMA vez (no AppShell), sem parâmetros.
 *
 * Usa `useStore.getState()` dentro do intervalo para não recriar o timer a cada passo.
 */
import { useEffect } from 'react';
import { useStore } from '../estado/store';

export function usePlayer(): void {
  const executando = useStore((s) => s.depuracao.executando);
  const velocidade = useStore((s) => s.depuracao.velocidade);

  useEffect(() => {
    if (!executando) return undefined;
    const intervalo = setInterval(() => {
      // `avancar` devolve false no fim e já desliga `executando`, o que limpa este intervalo.
      useStore.getState().avancar();
    }, 1000 / velocidade);
    return () => clearInterval(intervalo);
  }, [executando, velocidade]);
}
