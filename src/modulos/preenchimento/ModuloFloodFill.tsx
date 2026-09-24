/**
 * Módulo "Flood Fill" (slides "CG 08 Preenchimento"): recolore a região conexa que tem a cor da
 * semente (`cor_antiga`). A interação fica no `PainelPreenchimento` compartilhado.
 */
import { PainelPreenchimento } from './PainelPreenchimento';

export function ModuloFloodFill() {
  return (
    <PainelPreenchimento
      tipo="flood"
      sobre={
        <>
          <p style={{ marginTop: 0 }}>
            Recolore com <code>cor_preenche</code> as células alcançáveis que têm a cor do interior,{' '}
            <code>cor_antiga</code>, lida na semente. Qualquer outra cor funciona como fronteira, então não é preciso
            informar a cor do contorno.
          </p>
          <p>
            Se <code>cor_antiga = cor_preenche</code> não há o que recolorir e o procedimento retorna logo na primeira
            linha. Clicar num contorno recolore o próprio contorno.
          </p>
          <p style={{ marginBottom: 0 }}>
            A listagem é a versão iterativa, com pilha explícita, equivalente à recursiva dos slides.
          </p>
        </>
      }
    />
  );
}
