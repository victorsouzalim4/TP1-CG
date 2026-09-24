/**
 * Módulo "Boundary Fill" (slides "CG 08 Preenchimento"): preenche a partir da semente até
 * encontrar a cor do contorno. A interação fica no `PainelPreenchimento` compartilhado.
 */
import { PainelPreenchimento } from './PainelPreenchimento';

export function ModuloBoundaryFill() {
  return (
    <PainelPreenchimento
      tipo="boundary"
      sobre={
        <>
          <p style={{ marginTop: 0 }}>
            A partir da semente, pinta com <code>cor_preenche</code> toda célula alcançável cuja cor não seja{' '}
            <code>cor_contorno</code> (nem a própria <code>cor_preenche</code>, para não repintar).
          </p>
          <p>
            Com conectividade 8 o preenchimento também anda pelas diagonais e <strong>vaza</strong> por contornos que só se
            tocam pelos cantos (ex.: arestas inclinadas a 45°). A borda da grade funciona como contorno.
          </p>
          <p style={{ marginBottom: 0 }}>
            A listagem é a versão iterativa, com pilha explícita, equivalente à recursiva dos slides: os vizinhos são
            empilhados em ordem inversa para que (x+1, y) seja visitado primeiro.
          </p>
        </>
      }
    />
  );
}
