/**
 * Controles da transformação 2D: tipo (translação, rotação, escala, reflexão), fatores informados
 * pelo usuário (nenhum valor é fixo no código) e escolha do pivô. Só entrada por clique/arrasto.
 *
 * Componente presentacional: o estado fica no `ModuloTransformacoes`.
 */
import type { Ponto } from '../../core/tipos';
import { formatarNumero } from '../../core/geometria';
import type { EixoReflexao, TipoTransformacao, Transformacao } from '../../core/transformacoes/montarMatriz';
import { Botao } from '../../componentes/controles/Botao';
import { BotoesSegmentados, type OpcaoSegmentada } from '../../componentes/controles/BotoesSegmentados';
import { Slider, type PresetSlider } from '../../componentes/controles/Slider';
import { Stepper } from '../../componentes/controles/Stepper';

/** Todos os fatores editáveis; só os do `tipo` escolhido entram na matriz. */
export interface ValoresTransformacao {
  tipo: TipoTransformacao;
  tx: number;
  ty: number;
  /** Graus, anti-horário. */
  angulo: number;
  sx: number;
  sy: number;
  /** Escala uniforme: sx = sy (um único controle). */
  uniforme: boolean;
  eixo: EixoReflexao;
}

/** Valores iniciais neutros (não transformam nada até o usuário escolher os fatores). */
export const VALORES_INICIAIS: ValoresTransformacao = {
  tipo: 'translacao',
  tx: 0,
  ty: 0,
  angulo: 0,
  sx: 1,
  sy: 1,
  uniforme: true,
  eixo: 'x',
};

export type ModoPivo = 'origem' | 'centroide' | 'clique';

/** Converte os valores dos controles na transformação básica usada por `montarMatriz`. */
export function paraTransformacao(v: ValoresTransformacao): Transformacao {
  switch (v.tipo) {
    case 'translacao':
      return { tipo: 'translacao', tx: v.tx, ty: v.ty };
    case 'rotacao':
      return { tipo: 'rotacao', angulo: v.angulo };
    case 'escala':
      return { tipo: 'escala', sx: v.sx, sy: v.uniforme ? v.sx : v.sy };
    case 'reflexao':
      return { tipo: 'reflexao', eixo: v.eixo };
  }
}

const OPCOES_TIPO: readonly OpcaoSegmentada<TipoTransformacao>[] = [
  { valor: 'translacao', rotulo: 'Translação', titulo: "Desloca: x' = x + tx, y' = y + ty" },
  { valor: 'rotacao', rotulo: 'Rotação', titulo: 'Gira θ graus em torno do pivô (anti-horário)' },
  { valor: 'escala', rotulo: 'Escala', titulo: "Multiplica as distâncias ao pivô: x' = sx·x, y' = sy·y" },
  { valor: 'reflexao', rotulo: 'Reflexão', titulo: 'Espelha em torno de um eixo ou da origem' },
];

const OPCOES_EIXO: readonly OpcaoSegmentada<EixoReflexao>[] = [
  { valor: 'x', rotulo: 'X', titulo: 'Em torno do eixo X: (x, y) → (x, −y)' },
  { valor: 'y', rotulo: 'Y', titulo: 'Em torno do eixo Y: (x, y) → (−x, y)' },
  { valor: 'xy', rotulo: 'XY', titulo: 'Em relação à origem (eixos X e Y): (x, y) → (−x, −y)' },
];

const OPCOES_PIVO: readonly OpcaoSegmentada<ModoPivo>[] = [
  { valor: 'origem', rotulo: 'Origem', titulo: 'Pivô em (0, 0)' },
  { valor: 'centroide', rotulo: 'Centroide', titulo: 'Pivô na média dos vértices dos objetos selecionados' },
  { valor: 'clique', rotulo: 'Clique na grade', titulo: 'Clique numa célula para definir o pivô' },
];

const PRESETS_ANGULO: readonly PresetSlider[] = [
  { rotulo: '90°', valor: 90 },
  { rotulo: '−90°', valor: -90 },
  { rotulo: '180°', valor: 180 },
];

const PRESETS_ESCALA: readonly PresetSlider[] = [
  { rotulo: '½', valor: 0.5 },
  { rotulo: '1', valor: 1 },
  { rotulo: '2', valor: 2 },
];

const graus = (v: number): string => `${formatarNumero(v)}°`;

export interface PainelTransformacaoProps {
  valores: ValoresTransformacao;
  onValores(v: ValoresTransformacao): void;
  modoPivo: ModoPivo;
  onModoPivo(m: ModoPivo): void;
  /** Pivô efetivo (null quando ainda não pode ser calculado: sem clique ou sem seleção). */
  pivo: Ponto | null;
  /** `true` enquanto a grade espera o clique do pivô. */
  definindoPivo: boolean;
  onDefinirPivo(): void;
  disabled?: boolean;
}

export function PainelTransformacao({
  valores,
  onValores,
  modoPivo,
  onModoPivo,
  pivo,
  definindoPivo,
  onDefinirPivo,
  disabled = false,
}: PainelTransformacaoProps) {
  const alterar = (parcial: Partial<ValoresTransformacao>): void => onValores({ ...valores, ...parcial });
  const usaPivo = valores.tipo !== 'translacao';

  let textoPivo: string;
  if (!usaPivo) textoPivo = 'A translação não tem ponto fixo: o pivô não é usado.';
  else if (definindoPivo) textoPivo = 'Clique na célula do pivô na grade…';
  else if (pivo) textoPivo = `Pivô = (${formatarNumero(pivo.x)}, ${formatarNumero(pivo.y)})`;
  else if (modoPivo === 'centroide') textoPivo = 'Selecione objetos para calcular o centroide.';
  else textoPivo = 'Pivô ainda não definido.';

  return (
    <div className="pilha">
      <BotoesSegmentados opcoes={OPCOES_TIPO} valor={valores.tipo} onChange={(tipo) => alterar({ tipo })} compacto rotulo="Tipo de transformação" />

      {valores.tipo === 'translacao' && (
        <div className="pilha">
          <Stepper rotulo="tx" valor={valores.tx} min={-30} max={30} onChange={(tx) => alterar({ tx })} disabled={disabled} />
          <Stepper rotulo="ty" valor={valores.ty} min={-30} max={30} onChange={(ty) => alterar({ ty })} disabled={disabled} />
        </div>
      )}

      {valores.tipo === 'rotacao' && (
        <Slider
          rotulo="θ (anti-horário)"
          valor={valores.angulo}
          min={-180}
          max={180}
          passo={5}
          formatar={graus}
          presets={PRESETS_ANGULO}
          onChange={(angulo) => alterar({ angulo })}
          disabled={disabled}
        />
      )}

      {valores.tipo === 'escala' && (
        <div className="pilha">
          <div className="linha">
            <Botao
              pequeno
              ativo={valores.uniforme}
              disabled={disabled}
              title="Liga/desliga a escala uniforme (sx = sy)"
              onClick={() => alterar({ uniforme: !valores.uniforme, sy: valores.sx })}
            >
              Escala uniforme
            </Botao>
          </div>
          {valores.uniforme ? (
            <Slider
              rotulo="s (sx = sy)"
              valor={valores.sx}
              min={0.1}
              max={4}
              passo={0.1}
              presets={PRESETS_ESCALA}
              onChange={(s) => alterar({ sx: s, sy: s })}
              disabled={disabled}
            />
          ) : (
            <>
              <Slider rotulo="sx" valor={valores.sx} min={0.1} max={4} passo={0.1} presets={PRESETS_ESCALA} onChange={(sx) => alterar({ sx })} disabled={disabled} />
              <Slider rotulo="sy" valor={valores.sy} min={0.1} max={4} passo={0.1} presets={PRESETS_ESCALA} onChange={(sy) => alterar({ sy })} disabled={disabled} />
            </>
          )}
        </div>
      )}

      {valores.tipo === 'reflexao' && (
        <div className="linha">
          <span className="texto-pequeno texto-suave">Eixo</span>
          <BotoesSegmentados opcoes={OPCOES_EIXO} valor={valores.eixo} onChange={(eixo) => alterar({ eixo })} rotulo="Eixo da reflexão" />
        </div>
      )}

      <div className="pilha">
        <span className="texto-pequeno texto-suave">Pivô (ponto fixo)</span>
        <BotoesSegmentados
          opcoes={OPCOES_PIVO.map((o) => ({ ...o, desabilitada: disabled || !usaPivo }))}
          valor={modoPivo}
          onChange={onModoPivo}
          compacto
          rotulo="Pivô"
        />
        <div className="linha">
          <span className="texto-pequeno">{textoPivo}</span>
          {usaPivo && modoPivo === 'clique' && !definindoPivo && (
            <Botao pequeno disabled={disabled} onClick={onDefinirPivo} title="Escolhe outra célula para o pivô">
              Escolher outro
            </Botao>
          )}
        </div>
      </div>
    </div>
  );
}
