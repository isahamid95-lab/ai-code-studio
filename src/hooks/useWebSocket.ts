import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket hook with automatic reconnection
 * Features:
 * - Auto-reconnect on disconnect
 * - Exponential backoff
 * - Connection status tracking
 * - Message queue while disconnected
 */
export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const connect = useCallback(() => {
    // Clear any pending reconnection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setLastError(null);
        onOpen?.();
        
        // Send queued messages
        if (messageQueue.current.length > 0) {
          console.log(`[WebSocket] Sending ${messageQueue.current.length} queued messages`);
          messageQueue.current.forEach(msg => ws.send(msg));
          messageQueue.current = [];
        }
      };
      
      ws.onmessage = (event) => {
        onMessage?.(event.data);
      };
      
      ws.onclose = (event) => {
        console.log(`[WebSocket] Disconnected (code: ${event.code}, reason: ${event.reason || 'unknown'})`);
        setIsConnected(false);
        onClose?.();
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
          setLastError('Connection lost. Please refresh the page.');
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setLastError('Connection error');
        onError?.(error);
        ws.close();
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setLastError('Failed to connect');
      
      // Retry after delay
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      // Queue message for when connection is restored
      console.warn('[WebSocket] Not connected, queuing message');
      messageQueue.current.push(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    reconnectAttempts.current = maxReconnectAttempts; // Prevent auto-reconnect
    wsRef.current?.close();
  }, [maxReconnectAttempts]);

  return { 
    isConnected, 
    sendMessage, 
    disconnect,
    lastError,
    reconnectAttempts: reconnectAttempts.current,
  };
}
