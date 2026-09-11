/**
 * Lista de módulos (algoritmos) agrupada por `grupo`, com o módulo ativo destacado.
 */
import type { DefinicaoModulo, GrupoModulo, ModuloId } from '../../modulos/registro';
import './layout.css';

export interface ListaModulosProps {
  modulos: readonly DefinicaoModulo[];
  ativo: ModuloId;
  onSelecionar(id: ModuloId): void;
}

/** Agrupa preservando a ordem de aparição dos grupos e dos módulos. */
function agruparModulos(modulos: readonly DefinicaoModulo[]): Array<{ grupo: GrupoModulo; itens: DefinicaoModulo[] }> {
  const grupos: Array<{ grupo: GrupoModulo; itens: DefinicaoModulo[] }> = [];
  for (const m of modulos) {
    const existente = grupos.find((g) => g.grupo === m.grupo);
    if (existente) existente.itens.push(m);
    else grupos.push({ grupo: m.grupo, itens: [m] });
  }
  return grupos;
}

export function ListaModulos({ modulos, ativo, onSelecionar }: ListaModulosProps) {
  return (
    <nav className="lista-modulos" aria-label="Algoritmos">
      {agruparModulos(modulos).map(({ grupo, itens }) => (
        <div key={grupo} className="lista-modulos__grupo">
          <div className="lista-modulos__titulo-grupo">{grupo}</div>
          {itens.map((m) => {
            const ehAtivo = m.id === ativo;
            return (
              <button
                key={m.id}
                type="button"
                className={'lista-modulos__item' + (ehAtivo ? ' lista-modulos__item--ativo' : '')}
                aria-current={ehAtivo ? 'page' : undefined}
                title={m.titulo}
                onClick={() => {
                  if (!ehAtivo) onSelecionar(m.id);
                }}
              >
                {m.titulo}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
