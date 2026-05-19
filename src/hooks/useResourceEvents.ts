import { useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../api/client';

type ResourceKind = 'game' | 'lobby';

/**
 * Subscribe to server-sent game/lobby update notifications; refetch via onUpdated.
 * EventSource cannot set Authorization headers, so the Firebase ID token is passed as ?token=.
 */
export function useResourceEvents(
  kind: ResourceKind,
  id: string | undefined,
  enabled: boolean,
  getToken: () => Promise<string | null>,
  onUpdated: () => void
): void {
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  useEffect(() => {
    if (!id || !enabled) return;

    let closed = false;
    let es: EventSource | null = null;

    const connect = async () => {
      const token = await getToken();
      if (!token || closed) return;

      const path =
        kind === 'game' ? `/api/game/${encodeURIComponent(id)}/events` : `/api/lobby/${encodeURIComponent(id)}/events`;
      const url = `${getApiBaseUrl()}${path}?token=${encodeURIComponent(token)}`;
      es = new EventSource(url);
      es.addEventListener('updated', () => {
        if (!closed) onUpdatedRef.current();
      });
    };

    void connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, [kind, id, enabled, getToken]);
}
