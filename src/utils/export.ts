import JSZip from 'jszip';
import { getWebContainer } from '../lib/webcontainer';

export async function exportWorkspaceAsZip() {
  try {
    const wc = await getWebContainer();
    const zip = new JSZip();

    async function addFilesToZip(dirPath: string, zipFolder: JSZip) {
      const entries = await wc.fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
        
        const fullPath = dirPath === '/' ? `/${entry.name}` : `${dirPath}/${entry.name}`;
        
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name);
          if (subFolder) {
            await addFilesToZip(fullPath, subFolder);
          }
        } else {
          // Read raw uint8array bytes
          const content = await wc.fs.readFile(fullPath);
          zipFolder.file(entry.name, content);
        }
      }
    }

    await addFilesToZip('/', zip);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-studio-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export workspace:', error);
    alert('Export failed. Ensure the workspace has files.');
  }
}
