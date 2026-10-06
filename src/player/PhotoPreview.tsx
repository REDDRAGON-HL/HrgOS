import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PhotoClue } from '../data/photoClues';

export function PhotoPreview({ photo, order }: { photo: PhotoClue; order: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={ref} className={`photo-preview ${visible && loaded ? 'is-visible' : ''} ${loaded ? 'is-loaded' : ''} ${failed ? 'is-failed' : ''}`} style={{ '--photo-delay': `${(order % 5) * 90}ms` } as CSSProperties} aria-hidden="true">
      {!failed ? <>
        <img className="photo-preview__base" src={photo.preview} alt="" loading={order < 5 ? 'eager' : 'lazy'} decoding="async" draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
        <img className="photo-preview__haze" src={photo.preview} alt="" loading="lazy" decoding="async" draggable={false} />
      </> : <span className="photo-preview__error">图片暂不可用</span>}
    </span>
  );
}
