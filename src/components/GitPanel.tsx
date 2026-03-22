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
      <div className="flex items-center justify-center py-8 text-cyan-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
        <GitBranch size={48} className="text-white/20" />
        <p className="text-sm text-white/60">No Git repository found.</p>
        <button 
          onClick={onGitInit}
          className="glass-button px-4 py-2 text-sm text-cyan-300 rounded-lg"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Remote Setup */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase">Remote</span>
          <button onClick={() => onSetIsSettingRemote(!isSettingRemote)} className="text-white/40 hover:text-white">
            <Settings size={14} />
          </button>
        </div>
        {isSettingRemote && (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={remoteUrl}
              onChange={e => onSetRemoteUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="flex-1 bg-black/40 text-xs text-white px-2 py-1 border border-white/10 rounded outline-none"
            />
            <button onClick={onGitRemote} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 rounded">Save</button>
          </div>
        )}
        {remoteUrl && !isSettingRemote && (
          <div className="text-xs text-white/60 truncate" title={remoteUrl}>{remoteUrl}</div>
        )}
        <div className="flex gap-2 mt-1">
          <button onClick={onGitPull} disabled={!remoteUrl} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded disabled:opacity-50">
            <GitPullRequest size={12} /> Pull
          </button>
          <button onClick={onGitPush} disabled={!remoteUrl} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded disabled:opacity-50">
            <Send size={12} /> Push
          </button>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Commit Area */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/50 uppercase">Commit</span>
        <textarea
          value={commitMessage}
          onChange={e => onSetCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full bg-black/40 text-sm text-white p-2 border border-white/10 rounded-lg outline-none resize-none h-20"
        />
        <button 
          onClick={onGitCommit}
          disabled={!commitMessage.trim() || (gitStatus.status.staged.length === 0)}
          className="glass-button py-1.5 text-sm text-cyan-300 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <GitCommit size={14} /> Commit
        </button>
      </div>

      <hr className="border-white/10" />

      {/* Staged Changes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase">Staged Changes ({gitStatus.status.staged.length})</span>
          <button onClick={() => onGitUnstage('.')} className="text-xs text-white/40 hover:text-white" title="Unstage All">
            <MinusCircle size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {gitStatus.status.staged.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-xs text-emerald-400 px-2 py-1 bg-white/5 rounded">
              <span className="truncate">{file}</span>
              <button onClick={() => onGitUnstage(file)} className="text-white/40 hover:text-white">
                <MinusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.staged.length === 0 && <span className="text-xs text-white/30 italic px-2">No staged changes</span>}
        </div>
      </div>

      {/* Unstaged Changes */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase">Changes ({gitStatus.status.modified.length + gitStatus.status.not_added.length + gitStatus.status.deleted.length})</span>
          <button onClick={() => onGitStage('.')} className="text-xs text-white/40 hover:text-white" title="Stage All">
            <PlusCircle size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {gitStatus.status.modified.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-xs text-amber-400 px-2 py-1 bg-white/5 rounded">
              <span className="truncate">{file}</span>
              <button onClick={() => onGitStage(file)} className="text-white/40 hover:text-white">
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.deleted.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-xs text-red-400 px-2 py-1 bg-white/5 rounded">
              <span className="truncate">{file}</span>
              <button onClick={() => onGitStage(file)} className="text-white/40 hover:text-white">
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {gitStatus.status.not_added.map((file: string) => (
            <div key={file} className="flex items-center justify-between text-xs text-cyan-400 px-2 py-1 bg-white/5 rounded">
              <span className="truncate">{file}</span>
              <button onClick={() => onGitStage(file)} className="text-white/40 hover:text-white">
                <PlusCircle size={12} />
              </button>
            </div>
          ))}
          {(gitStatus.status.modified.length + gitStatus.status.not_added.length + gitStatus.status.deleted.length) === 0 && <span className="text-xs text-white/30 italic px-2">No changes</span>}
        </div>
      </div>
    </div>
  );
});

export default GitPanel;
