export interface LocationSession { leader: boolean; status: string; finished: boolean }
export interface LocationPayload { latitude: number; longitude: number; accuracy: number; capturedAt: number; foreground: true }
interface LocationDependencies {
  geolocation: Pick<Geolocation, 'watchPosition' | 'clearWatch'>;
  isVisible: () => boolean;
  subscribeVisibility: (callback: () => void) => () => void;
  send: (payload: LocationPayload) => Promise<void>;
  now?: () => number;
  onError?: (message: string) => void;
}

export function createLocationReporter(dependencies: LocationDependencies) {
  let session: LocationSession = { leader: false, status: 'READY', finished: false };
  let watchId: number | null = null; let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: GeolocationPosition | null = null; let lastAttempt = -Infinity; let sending = false; let stopped = false;
  const now = dependencies.now ?? Date.now;
  const allowed = () => !stopped && session.leader && session.status === 'RUNNING' && !session.finished && dependencies.isVisible();
  const clear = () => {
    if (watchId !== null) dependencies.geolocation.clearWatch(watchId);
    watchId = null; latest = null; if (timer !== null) clearTimeout(timer); timer = null;
  };
  const flush = async () => {
    timer = null; if (!allowed() || !latest || sending) return;
    const delay = 3000 - (now() - lastAttempt);
    if (delay > 0) { timer = setTimeout(() => { void flush(); }, delay); return; }
    const position = latest; latest = null; sending = true; lastAttempt = now();
    try { await dependencies.send({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: position.timestamp, foreground: true }); }
    catch { dependencies.onError?.('位置上报失败，可继续提交任务；检查网络后重试。'); }
    finally { sending = false; if (latest && allowed()) void flush(); }
  };
  const synchronize = () => {
    if (!allowed()) { clear(); return; }
    if (watchId !== null) return;
    watchId = dependencies.geolocation.watchPosition(position => { if (!allowed()) return; latest = position; if (timer === null) void flush(); }, error => { dependencies.onError?.(error.code === 1 ? '定位权限被拒绝，可使用区域审核作为替代证明。' : '定位暂不可用，可继续提交任务。'); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  };
  const unsubscribe = dependencies.subscribeVisibility(synchronize);
  return {
    configure(next: LocationSession) { if (stopped) return; session = next; synchronize(); },
    stop() { stopped = true; clear(); unsubscribe(); }
  };
}
