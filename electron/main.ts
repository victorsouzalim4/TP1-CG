/**
 * Processo principal do Electron.
 *
 * Responsabilidades:
 *  - criar a janela da aplicação com as dimensões alvo do layout (1366x768);
 *  - carregar o servidor de desenvolvimento do Vite (quando `VITE_DEV_SERVER_URL` está definida)
 *    ou o build estático em `dist/index.html` (executável/instalador);
 *  - manter o renderer isolado (sem acesso ao Node), pois a aplicação não precisa de APIs nativas.
 */
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'node:path';

const URL_DEV = process.env.VITE_DEV_SERVER_URL;

function criarJanela(): void {
  const janela = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1200,
    minHeight: 700,
    title: 'Simulador de Computação Gráfica - TP1',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // A aplicação é totalmente operada por mouse; o menu padrão só atrapalharia.
  Menu.setApplicationMenu(null);

  // Links externos (se houver) abrem no navegador do sistema, nunca dentro da janela.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (URL_DEV) {
    void janela.loadURL(URL_DEV);
  } else {
    void janela.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  criarJanela();

  // macOS: recria a janela ao clicar no dock sem janelas abertas.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

// Windows/Linux: encerra o processo quando a última janela fecha.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
