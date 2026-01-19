export interface HostIdentity {
  externalUserId?: string;
  nickname?: string;
}

const STORAGE_KEY = 'bt-identity-v1';

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readHostIdentity(): HostIdentity {
  const fromStorage = safeJsonParse<HostIdentity>(localStorage.getItem(STORAGE_KEY)) || {};
  const params = new URLSearchParams(window.location.search);
  const qpExternalUserId = params.get('bt_uid') || undefined;
  const qpNickname = params.get('bt_nick') || undefined;

  const fromWindow = (window as any).__BT_IDENTITY__ as HostIdentity | undefined;

  return {
    externalUserId: qpExternalUserId ?? fromWindow?.externalUserId ?? fromStorage.externalUserId,
    nickname: qpNickname ?? fromWindow?.nickname ?? fromStorage.nickname,
  };
}

export function persistHostIdentity(identity: HostIdentity) {
  const existing = safeJsonParse<HostIdentity>(localStorage.getItem(STORAGE_KEY)) || {};
  const merged: HostIdentity = {
    externalUserId: identity.externalUserId ?? existing.externalUserId,
    nickname: identity.nickname ?? existing.nickname,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function initHostIdentityBridge(onUpdate?: (identity: HostIdentity) => void): () => void {
  const handler = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'BT_IDENTITY') return;

    const payload = (data.payload || {}) as HostIdentity;
    persistHostIdentity(payload);
    onUpdate?.(readHostIdentity());
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export function getNickname(firebaseUid: string, identity?: HostIdentity): string {
  const nick = identity?.nickname?.trim();
  if (nick) return nick.slice(0, 20);
  return `Player_${firebaseUid.slice(-4)}`;
}


