/**
 * Barra de ferramentas da grade: tamanho, origem (canto/centro), eixos, cor, limpar e desfazer.
 * Tudo por clique; `extras` recebe controles específicos do módulo (alinhados à direita).
 */
import type { ReactNode } from 'react';
import { BotoesSegmentados } from '../controles/BotoesSegmentados';
import { Paleta } from '../controles/Paleta';
import { Botao } from '../controles/Botao';
import './layout.css';

export type ModoOrigem = 'canto' | 'centro';

export interface TamanhoGrade {
  rotulo: string;
  largura: number;
  altura: number;
}

export interface BarraFerramentasProps {
  tamanhos: readonly TamanhoGrade[];
  tamanhoAtual: { largura: number; altura: number };
  onTamanho(largura: number, altura: number): void;
  modoOrigem: ModoOrigem;
  onModoOrigem(modo: ModoOrigem): void;
  mostrarEixos: boolean;
  onAlternarEixos(): void;
  corAtual: string;
  onCor(hex: string): void;
  onLimpar(): void;
  onDesfazer(): void;
  podeDesfazer: boolean;
  extras?: ReactNode;
}

const OPCOES_ORIGEM = [
  { valor: 'canto', rotulo: 'Canto', titulo: 'Origem (0,0) no canto inferior-esquerdo' },
  { valor: 'centro', rotulo: 'Centro', titulo: 'Origem (0,0) no centro da grade' },
] as const;

function chaveTamanho(largura: number, altura: number): string {
  return `${largura}x${altura}`;
}

export function BarraFerramentas({
  tamanhos,
  tamanhoAtual,
  onTamanho,
  modoOrigem,
  onModoOrigem,
  mostrarEixos,
  onAlternarEixos,
  corAtual,
  onCor,
  onLimpar,
  onDesfazer,
  podeDesfazer,
  extras,
}: BarraFerramentasProps) {
  const opcoesTamanho = tamanhos.map((t) => ({
    valor: chaveTamanho(t.largura, t.altura),
    rotulo: t.rotulo,
    titulo: `Grade de ${t.largura} × ${t.altura} células`,
  }));

  return (
    <div className="barra-ferramentas" role="toolbar" aria-label="Ferramentas da grade">
      <div className="barra-ferramentas__grupo">
        <BotoesSegmentados
          compacto
          rotulo="Tamanho da grade"
          opcoes={opcoesTamanho}
          valor={chaveTamanho(tamanhoAtual.largura, tamanhoAtual.altura)}
          onChange={(chave) => {
            const t = tamanhos.find((x) => chaveTamanho(x.largura, x.altura) === chave);
            if (t) onTamanho(t.largura, t.altura);
          }}
        />
      </div>

      <span className="barra-ferramentas__separador" />

      <div className="barra-ferramentas__grupo">
        <BotoesSegmentados compacto rotulo="Origem" opcoes={OPCOES_ORIGEM} valor={modoOrigem} onChange={onModoOrigem} />
        <Botao pequeno ativo={mostrarEixos} onClick={onAlternarEixos} title={mostrarEixos ? 'Ocultar eixos' : 'Mostrar eixos'}>
          Eixos
        </Botao>
      </div>

      <span className="barra-ferramentas__separador" />

      <div className="barra-ferramentas__grupo">
        <Paleta compacta valor={corAtual} onChange={onCor} rotulo="Cor" />
      </div>

      <span className="barra-ferramentas__separador" />

      <div className="barra-ferramentas__grupo">
        <Botao pequeno onClick={onDesfazer} disabled={!podeDesfazer} title="Desfazer a última ação">
          Desfazer
        </Botao>
        <Botao pequeno variante="perigo" onClick={onLimpar} title="Apagar todos os objetos da grade">
          Limpar
        </Botao>
      </div>

      {extras !== undefined && <div className="barra-ferramentas__extras">{extras}</div>}
    </div>
  );
}
