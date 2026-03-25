import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: { old: number | null; new: number | null };
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filename?: string;
  showLineNumbers?: boolean;
  contextLines?: number;
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let oldIndex = 0;
  let newIndex = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    if (oldIndex >= oldLines.length) {
      result.push({
        type: 'add',
        content: newLine,
        lineNumber: { old: null, new: newIndex + 1 },
      });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      result.push({
        type: 'remove',
        content: oldLine,
        lineNumber: { old: oldIndex + 1, new: null },
      });
      oldIndex++;
    } else if (oldLine === newLine) {
      result.push({
        type: 'context',
        content: oldLine,
        lineNumber: { old: oldIndex + 1, new: newIndex + 1 },
      });
      oldIndex++;
      newIndex++;
    } else if (!newSet.has(oldLine)) {
      result.push({
        type: 'add',
        content: newLine,
        lineNumber: { old: null, new: newIndex + 1 },
      });
      newIndex++;
    } else if (!oldSet.has(newLine)) {
      result.push({
        type: 'remove',
        content: oldLine,
        lineNumber: { old: oldIndex + 1, new: null },
      });
      oldIndex++;
    } else {
      result.push({
        type: 'remove',
        content: oldLine,
        lineNumber: { old: oldIndex + 1, new: null },
      });
      result.push({
        type: 'add',
        content: newLine,
        lineNumber: { old: null, new: newIndex + 1 },
      });
      oldIndex++;
      newIndex++;
    }
  }

  return result;
}

export function DiffViewer({
  oldContent,
  newContent,
  filename,
  showLineNumbers = true,
}: DiffViewerProps) {
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    return computeDiff(oldLines, newLines);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    const added = diffLines.filter((l) => l.type === 'add').length;
    const removed = diffLines.filter((l) => l.type === 'remove').length;
    return { added, removed };
  }, [diffLines]);

  return (
    <div className="diff-viewer rounded-lg overflow-hidden border border-[var(--color-border)]">
      {filename && (
        <div className="diff-header px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text)]">{filename}</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-500">+{stats.added}</span>
            <span className="text-red-500">-{stats.removed}</span>
          </div>
        </div>
      )}

      <div className="diff-content font-mono text-sm overflow-x-auto">
        {diffLines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: line.type === 'add' ? 20 : line.type === 'remove' ? -20 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`diff-line flex ${
              line.type === 'add'
                ? 'bg-green-500/10'
                : line.type === 'remove'
                ? 'bg-red-500/10'
                : 'bg-transparent'
            }`}
          >
            {showLineNumbers && (
              <div className="line-numbers flex shrink-0 w-16 text-right pr-3 text-[var(--color-text-muted)] select-none border-r border-[var(--color-border)]">
                <span className="w-6 text-red-400/50">
                  {line.lineNumber.old ?? ''}
                </span>
                <span className="w-6 text-green-400/50">
                  {line.lineNumber.new ?? ''}
                </span>
              </div>
            )}

            <div className="line-content flex-1 px-3 py-0.5">
              <span
                className={`${
                  line.type === 'add'
                    ? 'text-green-400'
                    : line.type === 'remove'
                    ? 'text-red-400'
                    : 'text-[var(--color-text)]'
                }`}
              >
                <span className="mr-2 select-none opacity-50">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                {line.content}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {diffLines.length === 0 && (
        <div className="p-8 text-center text-[var(--color-text-muted)]">
          No changes detected
        </div>
      )}
    </div>
  );
}

interface UnifiedDiffProps {
  diffText: string;
}

export function UnifiedDiffViewer({ diffText }: UnifiedDiffProps) {
  const lines = diffText.split('\n');

  return (
    <div className="unified-diff font-mono text-sm overflow-x-auto rounded-lg border border-[var(--color-border)]">
      {lines.map((line, index) => {
        let type: 'add' | 'remove' | 'context' | 'header' = 'context';
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
          type = 'header';
        } else if (line.startsWith('+')) {
          type = 'add';
        } else if (line.startsWith('-')) {
          type = 'remove';
        }

        return (
          <div
            key={index}
            className={`flex px-3 py-0.5 ${
              type === 'add'
                ? 'bg-green-500/10 text-green-400'
                : type === 'remove'
                ? 'bg-red-500/10 text-red-400'
                : type === 'header'
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-[var(--color-text)]'
            }`}
          >
            <span className="whitespace-pre">{line}</span>
          </div>
        );
      })}
    </div>
  );
}

interface FileChangePreviewProps {
  oldContent: string;
  newContent: string;
  filename: string;
  onClose?: () => void;
  onApply?: () => void;
}

export function FileChangePreview({
  oldContent,
  newContent,
  filename,
  onClose,
  onApply,
}: FileChangePreviewProps) {
  return (
    <div className="file-change-preview rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="preview-header px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--color-text)]">{filename}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Modified</span>
        </div>
        <div className="flex items-center gap-2">
          {onApply && (
            <button
              onClick={onApply}
              className="px-3 py-1.5 text-sm rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Apply Changes
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      <DiffViewer oldContent={oldContent} newContent={newContent} />
    </div>
  );
}