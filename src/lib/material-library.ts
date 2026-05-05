export function appendLibraryContent(currentContent: string, fileName: string, nextContent: string) {
  const current = currentContent.trim();
  const incoming = nextContent.trim();
  if (!current) return incoming;

  return `${current}\n\n---\n\n## 来源文件：${fileName}\n\n${incoming}`;
}

export function chooseLibraryFileName(existingFileName: string | null, nextFileName: string) {
  if (!existingFileName) return nextFileName;
  return existingFileName === nextFileName ? existingFileName : null;
}
