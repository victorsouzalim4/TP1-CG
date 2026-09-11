/**
 * Script de preload: única ponte entre o processo principal e o renderer.
 * A aplicação não precisa de APIs nativas, então expomos apenas informações inertes.
 */
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('aplicativo', {
  versao: process.env.npm_package_version ?? '1.0.0',
  plataforma: process.platform,
});
