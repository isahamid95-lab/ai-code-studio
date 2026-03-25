import { atom, computed } from 'nanostores';

// Agent mode state
export const $agentMode = atom<boolean>(false);
export const $planMode = atom<boolean>(false);
export const $agentStatus = atom<string>('');

// Agent run tracking
export const $activeRunId = atom<number | null>(null);
export const $completedRunIds = atom<Set<number>>(new Set());

// AI API configuration
export const $alibabaApiKey = atom<string>(import.meta.env.VITE_ALIBABA_API_KEY || '');
export const $alibabaModel = atom<string>('qwen3.5-plus');

// Computed: Is agent active
export const $isAgentActive = computed([$agentMode, $planMode], (agentMode, planMode) => {
  return agentMode || planMode;
});

// Computed: Current mode label
export const $agentModeLabel = computed([$agentMode, $planMode], (agentMode, planMode) => {
  if (agentMode) return 'Agent';
  if (planMode) return 'Plan';
  return 'Chat';
});

// Actions
export function setAgentMode(enabled: boolean) {
  $agentMode.set(enabled);
  if (enabled) {
    $planMode.set(false);
  }
}

export function setPlanMode(enabled: boolean) {
  $planMode.set(enabled);
  if (enabled) {
    $agentMode.set(false);
  }
}

export function toggleAgentMode() {
  const current = $agentMode.get();
  setAgentMode(!current);
}

export function togglePlanMode() {
  const current = $planMode.get();
  setPlanMode(!current);
}

export function setAgentStatus(status: string) {
  $agentStatus.set(status);
}

export function setActiveRunId(runId: number | null) {
  $activeRunId.set(runId);
}

export function markRunCompleted(runId: number) {
  const completed = $completedRunIds.get();
  const next = new Set(completed);
  next.add(runId);
  $completedRunIds.set(next);
}

export function isActiveRun(runId: number): boolean {
  return $activeRunId.get() === runId;
}

export function setAlibabaApiKey(key: string) {
  $alibabaApiKey.set(key);
}

export function setAlibabaModel(model: string) {
  $alibabaModel.set(model);
}

// Generate next run ID
let nextRunId = 0;
export function generateRunId(): number {
  nextRunId += 1;
  return nextRunId;
}

// Reset store
export function resetAgentStore() {
  $agentMode.set(false);
  $planMode.set(false);
  $agentStatus.set('');
  $activeRunId.set(null);
  $completedRunIds.set(new Set());
}