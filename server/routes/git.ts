import { Router } from 'express';
import simpleGit from 'simple-git';
import { getWorkspaceDir } from '../utils/workspace';

const router = Router();
const git = simpleGit(getWorkspaceDir());

/**
 * GET /api/git/status
 * Get git status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await git.status();
    res.json({
      isRepo: await git.checkIsRepo(),
      changed: status.files.map(f => ({
        path: f.path,
        status: f.working_dir || f.index,
      })),
      staged: status.staged,
      not_staged: status.modified,
      untracked: status.not_added,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/git/log
 * Get commit history
 */
router.get('/log', async (req, res) => {
  try {
    const log = await git.log({ maxCount: 20 });
    res.json(log.all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/git/branch
 * Get current branch
 */
router.get('/branch', async (req, res) => {
  try {
    const branch = await git.branch();
    res.json({
      current: branch.current,
      branches: branch.all,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/git/remotes
 * Get remote repositories
 */
router.get('/remotes', async (req, res) => {
  try {
    const remotes = await git.getRemotes();
    res.json(remotes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/init
 * Initialize git repository
 */
router.post('/init', async (req, res) => {
  try {
    await git.init();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/stage
 * Stage file(s)
 */
router.post('/stage', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }
    
    await git.add(files);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/unstage
 * Unstage file(s)
 */
router.post('/unstage', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }
    
    await git.reset(files);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/commit
 * Commit staged changes
 */
router.post('/commit', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Commit message is required' });
    }
    
    await git.addConfig('user.name', 'AI Studio User');
    await git.addConfig('user.email', 'user@aistudio.local');
    await git.commit(message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/remote
 * Set remote URL
 */
router.post('/remote', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Remote URL is required' });
    }
    
    const remotes = await git.getRemotes();
    if (remotes.find((r: any) => r.name === 'origin')) {
      await git.remote(['set-url', 'origin', url]);
    } else {
      await git.addRemote('origin', url);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/push
 * Push to remote
 */
router.post('/push', async (req, res) => {
  try {
    try {
      await git.push('origin', 'master', { '--set-upstream': null });
    } catch (err: any) {
      await git.push('origin', 'main', { '--set-upstream': null });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/pull
 * Pull from remote
 */
router.post('/pull', async (req, res) => {
  try {
    try {
      await git.pull('origin', 'master');
    } catch (err: any) {
      await git.pull('origin', 'main');
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/checkout
 * Switch branch
 */
router.post('/checkout', async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ error: 'Branch name is required' });
    }
    
    await git.checkout(branch);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as gitRoutes };
