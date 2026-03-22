import React from 'react';
import {
  GitBranch, GitCommit, GitPullRequest, Settings, Send,
  Loader2, PlusCircle, MinusCircle
} from 'lucide-react';

interface GitPanelProps {
  gitStatus: any;
  isGitLoading: boolean;
  commitMessage: string;
  remoteUrl: string;
  isSettingRemote: boolean;
  onSetCommitMessage: (val: string) => void;
  onSetRemoteUrl: (val: string) => void;
  onSetIsSettingRemote: (val: boolean) => void;
  onGitInit: () => void;
  onGitStage: (file: string) => void;
  onGitUnstage: (file: string) => void;
  onGitCommit: () => void;
  onGitRemote: () => void;
  onGitPush: () => void;
  onGitPull: () => void;
}

const GitPanel = React.memo(function GitPanel({
  gitStatus,
  isGitLoading,
  commitMessage,
  remoteUrl,
  isSettingRemote,
  onSetCommitMessage,
  onSetRemoteUrl,
  onSetIsSettingRemote,
  onGitInit,
  onGitStage,
  onGitUnstage,
  onGitCommit,
  onGitRemote,
  onGitPush,
  onGitPull,
}: GitPanelProps) {
  if (isGitLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-primary">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <GitBranch size={32} className="text-text/15" />
        </div>
        <p className="text-[12px] text-text/40">No Git repository found</p>
        <button 
          onClick={onGitInit}
          className="glass-button px-4 py-2 text-[12px] font-medium text-primary rounded-lg cursor-pointer"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Remote</span>
          <button
            onClick={() => onSetIsSettingRemote(!isSettingRemote)}
            className="text-text/25 hover:text-text/60 transition-colors cursor-pointer"
          >
            <Settings size={13} />
          </button>
        </div>
        {isSettingRemote && (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={remoteUrl}
              onChange={e => onSetRemoteUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="flex-1 bg-white/[0.03] text-[11px] text-text px-2.5 py-1.5 border border-white/[0.06] rounded-lg outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={onGitRemote}
              className="text-[11px] bg-primary/15 text-primary px-2.5 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
        {remoteUrl && !isSettingRemote && (
          <div className="text-[11px] text-text/40 truncate" title={remoteUrl}>{remoteUrl}</div>
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onGitPull}
            disabled={!remoteUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] rounded-lg disabled:opacity-30 transition-colors cursor-pointer text-text/50"
          >
            <GitPullRequest size={12} /> Pull
          </button>
          <button
            onClick={onGitPush}
            disabled={!remoteUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] rounded-lg disabled:opacity-30 transition-colors cursor-pointer text-text/50"
          >
            <Send size={12} /> Push
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.04]" />

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Commit</span>
        <textarea
          value={commitMessage}
          onChange={e => onSetCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full bg-white/[0.03] text-[12px] text-text p-2.5 border border-white/[0.06] rounded-lg outline-none resize-none h-20 focus:border-primary/40 transition-colors placeholder:text-text/20"
        />
        <button 
          onClick={onGitCommit}
          disabled={!commitMessage.trim() || (gitStatus.status.staged.length === 0)}
          className="glass-button py-1.5 text-[12px] font-medium text-primary rounded-lg disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <GitCommit size={13} /> Commit
        </button>
      </div>

      <div className="border-t border-white/[0.04]" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Staged Changes ({gitStatus.status.staged.length})</span>
          <button
            onClick={() => onGitUnstage('.')}
            className="text-text/25 hover:text-text/60 transition-colors cursor-pointer"
            title="Unstage All"
          >
            <MinusCircle size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {gitStatus.status.staged.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-[11px] text-emerald-400 px-2.5 py-1.5 bg-emerald-500/[0.06] rounded-lg">
              <span className="truncate">{file}</span>
              <button
                onClick={() => onGitUnstage(file)}
                className="text-text/25 hover:text-text/60 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <MinusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.staged.length === 0 && <span className="text-[11px] text-text/20 px-2">No staged changes</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Changes ({gitStatus.status.modified.length + gitStatus.status.not_added.length + gitStatus.status.deleted.length})</span>
          <button
            onClick={() => onGitStage('.')}
            className="text-text/25 hover:text-text/60 transition-colors cursor-pointer"
            title="Stage All"
          >
            <PlusCircle size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {gitStatus.status.modified.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-[11px] text-amber-400 px-2.5 py-1.5 bg-amber-500/[0.06] rounded-lg">
              <span className="truncate">{file}</span>
              <button
                onClick={() => onGitStage(file)}
                className="text-text/25 hover:text-text/60 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.deleted.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-[11px] text-red-400 px-2.5 py-1.5 bg-red-500/[0.06] rounded-lg">
              <span className="truncate">{file}</span>
              <button
                onClick={() => onGitStage(file)}
                className="text-text/25 hover:text-text/60 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.not_added.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-[11px] text-primary px-2.5 py-1.5 bg-primary/[0.06] rounded-lg">
              <span className="truncate">{file}</span>
              <button
                onClick={() => onGitStage(file)}
                className="text-text/25 hover:text-text/60 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {(gitStatus.status.modified.length + gitStatus.status.not_added.length + gitStatus.status.deleted.length) === 0 && <span className="text-[11px] text-text/20 px-2">No changes</span>}
        </div>
      </div>
    </div>
  );
});

export default GitPanel;
