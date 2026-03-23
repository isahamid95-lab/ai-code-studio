export async function exportWorkspaceAsZip() {
  try {
    const response = await fetch('/api/export');
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-studio-project.zip';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export workspace:', error);
    alert('Export failed. Ensure the workspace has files.');
  }
}
