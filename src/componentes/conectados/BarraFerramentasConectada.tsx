/**
 * `BarraFerramentas` ligada ao store: tamanho da grade, origem, eixos, cor, desfazer e limpar.
 */
import type { ReactNode } from 'react';
import { useStore } from '../../estado/store';
import { BarraFerramentas, type TamanhoGrade } from '../layout/BarraFerramentas';

/** Presets de tamanho da grade (colunas × linhas). */
export const TAMANHOS_GRADE: readonly TamanhoGrade[] = [
  { rotulo: '20×15', largura: 20, altura: 15 },
  { rotulo: '40×30', largura: 40, altura: 30 },
  { rotulo: '80×60', largura: 80, altura: 60 },
];

export function BarraFerramentasConectada({ extras }: { extras?: ReactNode }) {
  const grade = useStore((s) => s.grade);
  const corAtual = useStore((s) => s.ui.corAtual);
  const podeDesfazer = useStore((s) => s.cena.historico.length > 0);
  const definirTamanho = useStore((s) => s.definirTamanho);
  const definirModoOrigem = useStore((s) => s.definirModoOrigem);
  const alternarEixos = useStore((s) => s.alternarEixos);
  const definirCorAtual = useStore((s) => s.definirCorAtual);
  const limparCena = useStore((s) => s.limparCena);
  const desfazer = useStore((s) => s.desfazer);

  return (
    <BarraFerramentas
      tamanhos={TAMANHOS_GRADE}
      tamanhoAtual={{ largura: grade.largura, altura: grade.altura }}
      onTamanho={definirTamanho}
      modoOrigem={grade.modoOrigem}
      onModoOrigem={definirModoOrigem}
      mostrarEixos={grade.mostrarEixos}
      onAlternarEixos={alternarEixos}
      corAtual={corAtual}
      onCor={definirCorAtual}
      onLimpar={limparCena}
      onDesfazer={desfazer}
      podeDesfazer={podeDesfazer}
      extras={extras}
    />
  );
}
