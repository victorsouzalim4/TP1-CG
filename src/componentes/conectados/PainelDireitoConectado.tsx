/**
 * Painel direito ligado ao store: listagem do algoritmo em depuração (aba Código), variáveis do
 * passo atual (aba Variáveis) e objetos da cena (aba Objetos).
 */
import { useStore } from '../../estado/store';
import { useQuadroAtual } from '../../estado/seletores';
import { PainelDireito } from '../layout/PainelDireito';
import { AbaCodigo } from '../depurador/AbaCodigo';
import { AbaVariaveis } from '../depurador/AbaVariaveis';
import { AbaObjetos } from '../depurador/AbaObjetos';

export function PainelDireitoConectado() {
  const aba = useStore((s) => s.ui.abaDireita);
  const sessao = useStore((s) => s.depuracao.sessao);
  const objetos = useStore((s) => s.cena.objetos);
  const definirAba = useStore((s) => s.definirAba);
  const alternarSelecao = useStore((s) => s.alternarSelecao);
  const removerObjeto = useStore((s) => s.removerObjeto);
  const limparSelecao = useStore((s) => s.limparSelecao);
  const quadro = useQuadroAtual();

  return (
    <PainelDireito
      aba={aba}
      onMudarAba={definirAba}
      codigo={
        <AbaCodigo
          titulo={sessao?.nome}
          codigo={sessao?.codigo ?? ''}
          linhaAtual={quadro?.linha ?? null}
          descricao={quadro?.descricao}
        />
      }
      variaveis={<AbaVariaveis variaveis={quadro?.variaveis ?? {}} alteradas={quadro?.variaveisAlteradas} />}
      objetos={
        <AbaObjetos objetos={objetos} onAlternarSelecao={alternarSelecao} onRemover={removerObjeto} onLimparSelecao={limparSelecao} />
      }
    />
  );
}
