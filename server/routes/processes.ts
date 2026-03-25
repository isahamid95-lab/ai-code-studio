import { Router } from 'express';
import {
  getManagedProcessSnapshot,
  killManagedProcess,
  hasManagedProcess,
} from '../services/processManager';

const router = Router();

router.get('/', (req, res) => {
  const processes = getManagedProcessSnapshot();
  res.json({ processes });
});

router.delete('/:pid', (req, res) => {
  const pid = parseInt(req.params.pid);
  if (hasManagedProcess(pid)) {
    killManagedProcess(pid);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Process not found' });
  }
});

export { router as processRoutes };