// Entrada temporária para renderizar a DemoUI (removida após a validação).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoUI } from './componentes/DemoUI';
import './estilos/global.css';
createRoot(document.getElementById('root')!).render(<StrictMode><DemoUI /></StrictMode>);
