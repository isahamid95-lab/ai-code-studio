import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  
  if (!bootPromise) {
    console.log("Booting WebContainer environment...");
    bootPromise = WebContainer.boot();
  }

  try {
    webcontainerInstance = await bootPromise;
    console.log("WebContainer successfully booted");
    
    // Listen for dynamically spawned servers (e.g. npm run dev)
    webcontainerInstance.on('server-ready', (port, url) => {
      console.log(`WebContainer server ready at ${url} (port ${port})`);
      window.dispatchEvent(new CustomEvent('wc-server-ready', { detail: { port, url } }));
    });

    return webcontainerInstance;
  } catch (err) {
    console.error("Failed to boot WebContainer. Ensure COEP/COOP headers are configured.", err);
    throw err;
  }
}
