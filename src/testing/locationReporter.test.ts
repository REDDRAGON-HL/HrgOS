import { describe, expect, it, vi } from 'vitest';
import { createLocationReporter } from './locationReporter';

describe('队长定位采集公开生命周期', () => {
  it('仅队长在比赛运行且前台时采集，隐藏和完赛立即停止', () => {
    let visible = true; let changed = () => {};
    const geolocation = { watchPosition: vi.fn(() => 7), clearWatch: vi.fn() };
    const reporter = createLocationReporter({ geolocation, isVisible: () => visible, subscribeVisibility: callback => { changed = callback; return () => {}; }, send: async () => {} });
    reporter.configure({ leader: false, status: 'RUNNING', finished: false }); expect(geolocation.watchPosition).not.toHaveBeenCalled();
    reporter.configure({ leader: true, status: 'RUNNING', finished: false }); expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    visible = false; changed(); expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
    visible = true; changed(); expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    reporter.configure({ leader: true, status: 'RUNNING', finished: true }); expect(geolocation.clearWatch).toHaveBeenCalledTimes(2); reporter.stop();
  });

  it('三秒内多次变化只发送第一次及窗口结束时的最新位置', async () => {
    vi.useFakeTimers(); let update: PositionCallback = () => {};
    const sent: number[] = [];
    const reporter = createLocationReporter({ geolocation: { watchPosition: callback => { update = callback; return 1; }, clearWatch: () => {} }, isVisible: () => true, subscribeVisibility: () => () => {}, now: () => Date.now(), send: async position => { sent.push(position.latitude); } });
    try {
      reporter.configure({ leader: true, status: 'RUNNING', finished: false });
      const point = (latitude: number) => ({ coords: { latitude, longitude: 120, accuracy: 8 }, timestamp: Date.now() } as GeolocationPosition);
      update(point(30)); await vi.advanceTimersByTimeAsync(1000); update(point(31)); update(point(32)); expect(sent).toEqual([30]);
      await vi.advanceTimersByTimeAsync(2000); expect(sent).toEqual([30, 32]);
      reporter.configure({ leader: true, status: 'PAUSED', finished: false }); update(point(33)); await vi.advanceTimersByTimeAsync(3000); expect(sent).toEqual([30, 32]);
    } finally { reporter.stop(); vi.useRealTimers(); }
  });
});
