import { atom, computed } from 'nanostores';
import type { ChatMessage } from '../types';

// Default welcome message
const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  { id: '0', role: 'model', text: 'Welcome to AI Code Studio Pro! I can help you write, explain, or debug your code. How can I assist you today?' },
];

// Core chat state
export const $chatMessages = atom<ChatMessage[]>(DEFAULT_CHAT_MESSAGES);
export const $chatInput = atom<string>('');
export const $isGenerating = atom<boolean>(false);

// Chat scroll reference (stored as a function to scroll)
export const $chatScrollFn = atom<(() => void) | null>(null);

// Computed: Message count
export const $messageCount = computed($chatMessages, (messages) => messages.length);

// Computed: Last message
export const $lastMessage = computed($chatMessages, (messages) => messages[messages.length - 1] ?? null);

// Actions
export function setChatMessages(messages: ChatMessage[]) {
  $chatMessages.set(messages);
}

export function addChatMessage(message: ChatMessage) {
  $chatMessages.set([...$chatMessages.get(), message]);
}

export function updateChatMessage(id: string, updates: Partial<ChatMessage>) {
  $chatMessages.set(
    $chatMessages.get().map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    )
  );
}

export function removeChatMessage(id: string) {
  $chatMessages.set($chatMessages.get().filter((msg) => msg.id !== id));
}

export function clearChatMessages() {
  $chatMessages.set(DEFAULT_CHAT_MESSAGES);
}

export function setChatInput(input: string) {
  $chatInput.set(input);
}

export function setIsGenerating(isGenerating: boolean) {
  $isGenerating.set(isGenerating);
}

export function setChatScrollFn(fn: (() => void) | null) {
  $chatScrollFn.set(fn);
}

export function scrollChatToBottom() {
  $chatScrollFn.get()?.();
}

// Helper to create a new message
export function createMessage(role: ChatMessage['role'], text: string, variant?: 'default' | 'plan'): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text,
    timestamp: Date.now(),
    variant,
  };
}

// Reset store
export function resetChatStore() {
  $chatMessages.set(DEFAULT_CHAT_MESSAGES);
  $chatInput.set('');
  $isGenerating.set(false);
  $chatScrollFn.set(null);
}