import type { RuleResult } from './ruleSuite';

/** 只有用户主动勾选实机检查并点击运行后调用；不会上传相机画面。 */
export async function checkRealDevices(baseUrl: string, key: string, onResult: (result: RuleResult) => void) {
  const result = (id: string, title: string, status: RuleResult['status'], detail: string, durationMs = 0) => onResult({ id, title, status, detail, durationMs });
  if (!window.isSecureContext) { result('DEVICE-HTTPS', '设备安全上下文', 'failed', 'GPS、相机与 PWA 需要 HTTPS；本机 localhost 除外。'); return; }
  result('DEVICE-HTTPS', '设备安全上下文', 'passed', '当前页面是安全上下文。');
  const start = performance.now();
  let position: GeolocationPosition | undefined;
  try {
    position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('设备不支持定位')); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    });
  } catch { result('DEVICE-GPS', '真实 GPS 权限和采集', 'manual', '未获得位置，可能是权限被拒绝或设备无 GPS；请用手机重试。', Math.round(performance.now() - start)); }
  if (position) {
    let runId = '';
    const call = async (path: string, token: string, method: string, body?: unknown) => {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('真实位置联调接口失败'); return response.status === 204 ? {} : response.json();
    };
    try {
      const run = await call('/testing/runs', key, 'POST', {}); runId = run.id;
      const host = await call(`/testing/runs/${runId}/login`, '', 'POST', run.credentials.host);
      const player = await call(`/testing/runs/${runId}/login`, '', 'POST', run.credentials.player);
      await call(`/testing/runs/${runId}/commands`, host.token, 'POST', { type: 'transition', status: 'RUNNING' });
      await call(`/testing/runs/${runId}/commands`, player.token, 'POST', { type: 'location', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: position.timestamp, foreground: document.visibilityState === 'visible' });
      const stored = await call(`/testing/runs/${runId}/state`, host.token, 'GET');
      const location = stored.locations.find((item: { teamId: string }) => item.teamId === 'team-1');
      if (!location || location.latitude !== position.coords.latitude || location.longitude !== position.coords.longitude) throw new Error('定位未能从后端读回');
      result('DEVICE-GPS', '真实 GPS 采集与异地入库', 'passed', `真实位置已进入独立测试赛局，精度约 ${Math.round(position.coords.accuracy)} 米；报告不含经纬度。`, Math.round(performance.now() - start));
    } catch { result('DEVICE-GPS', '真实 GPS 采集与异地入库', 'failed', '设备已采集位置，但异地 API 未接收成功。'); }
    finally { if (runId) try { await call(`/testing/runs/${runId}`, key, 'DELETE'); } catch { result('DEVICE-CLEANUP', '清理真实定位测试赛局', 'failed', '清理失败；请工作人员删除该测试赛局，勿导出测试定位数据。'); } }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); stream.getTracks().forEach(track => track.stop());
    result('DEVICE-CAMERA', '真实相机权限和设备', 'passed', '相机可打开，已立即停止；没有拍照或上传画面。');
  } catch { result('DEVICE-CAMERA', '真实相机权限和设备', 'manual', '相机不可用或权限被拒绝，需要在手机上重试。'); }
  result('DEVICE-PUSH', 'PWA 与系统通知能力', 'manual', `Service Worker：${'serviceWorker' in navigator ? '支持' : '不支持'}；Web Push：${'PushManager' in window ? '支持' : '不支持'}；通知权限：${'Notification' in window ? Notification.permission : '不支持'}。支持状态不能证明后台通知已送达。`);
}
