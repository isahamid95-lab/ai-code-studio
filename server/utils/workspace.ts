import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

/**
 * Workspace dizinini oluştur veya mevcut olanı döndür
 */
export function getWorkspaceDir(): string {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
  return WORKSPACE_DIR;
}

/**
 * Path traversal saldırılarına karşı güvenli path oluştur
 */
export function safePath(userPath: string): string | null {
  const resolved = path.resolve(getWorkspaceDir(), userPath);
  if (!resolved.startsWith(getWorkspaceDir())) {
    return null;
  }
  return resolved;
}

/**
 * Workspace'deki tüm dosyaları listele
 */
export async function getWorkspaceFiles(
  dir: string = getWorkspaceDir(),
  relativePath: string = ''
): Promise<Array<{ name: string; path: string; content?: string }>> {
  const FILE_SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next']);
  const files: Array<{ name: string; path: string; content?: string }> = [];

  try {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (FILE_SKIP.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath 
        ? path.join(relativePath, entry.name) 
        : entry.name;

      if (entry.isDirectory()) {
        const subFiles = await getWorkspaceFiles(fullPath, relPath);
        files.push(...subFiles);
      } else {
        files.push({
          name: entry.name,
          path: relPath,
        });
      }
    }
  } catch (err) {
    console.error('[getWorkspaceFiles] Error:', err);
  }

  return files;
}

/**
 * Dosya içeriğini oku
 */
export async function readFileContent(filePath: string): Promise<string | null> {
  const safe = safePath(filePath);
  if (!safe) return null;

  try {
    return await fsPromises.readFile(safe, 'utf-8');
  } catch (err) {
    console.error('[readFileContent] Error:', err);
    return null;
  }
}

/**
 * Dosya içeriğini yaz
 */
export async function writeFileContent(
  filePath: string,
  content: string
): Promise<boolean> {
  const safe = safePath(filePath);
  if (!safe) return false;

  try {
    await fsPromises.mkdir(path.dirname(safe), { recursive: true });
    await fsPromises.writeFile(safe, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('[writeFileContent] Error:', err);
    return false;
  }
}

/**
 * Dosyayı sil
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  const safe = safePath(filePath);
  if (!safe) return false;

  try {
    await fsPromises.unlink(safe);
    return true;
  } catch (err) {
    console.error('[deleteFile] Error:', err);
    return false;
  }
}

/**
 * Dosyayı yeniden adlandır
 */
export async function renameFile(
  oldPath: string,
  newPath: string
): Promise<boolean> {
  const safeOld = safePath(oldPath);
  const safeNew = safePath(newPath);
  
  if (!safeOld || !safeNew) return false;

  try {
    await fsPromises.mkdir(path.dirname(safeNew), { recursive: true });
    await fsPromises.rename(safeOld, safeNew);
    return true;
  } catch (err) {
    console.error('[renameFile] Error:', err);
    return false;
  }
}

/**
 * Dizin oluştur
 */
export async function createDirectory(dirPath: string): Promise<boolean> {
  const safe = safePath(dirPath);
  if (!safe) return false;

  try {
    await fsPromises.mkdir(safe, { recursive: true });
    return true;
  } catch (err) {
    console.error('[createDirectory] Error:', err);
    return false;
  }
}
