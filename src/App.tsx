/**
 * Componente raiz: casca da aplicação com a lista de módulos, o módulo ativo e o painel de
 * depuração. O `usePlayer` é montado aqui, uma única vez, para a reprodução automática.
 */
import { useStore } from './estado/store';
import { usePlayer } from './depurador/usePlayer';
import { MODULOS, obterModulo } from './modulos/registro';
import { AppShell } from './componentes/layout/AppShell';
import { Cabecalho } from './componentes/layout/Cabecalho';
import { ListaModulos } from './componentes/layout/ListaModulos';
import { PainelDireitoConectado } from './componentes/conectados/PainelDireitoConectado';

export function App() {
  usePlayer();
  const moduloAtivo = useStore((s) => s.ui.moduloAtivo);
  const ativarModulo = useStore((s) => s.ativarModulo);
  const { titulo, componente: Modulo } = obterModulo(moduloAtivo);

  return (
    <AppShell
      cabecalho={<Cabecalho titulo="Simulador de Computação Gráfica — TP1" direita={<span className="texto-suave texto-pequeno">{titulo}</span>} />}
      lateral={<ListaModulos modulos={MODULOS} ativo={moduloAtivo} onSelecionar={ativarModulo} />}
      // `key` remonta o módulo ao trocar: o estado das ferramentas (P1 fixado etc.) recomeça.
      centro={<Modulo key={moduloAtivo} />}
      direita={<PainelDireitoConectado />}
    />
  );
}
