import { useEffect, useRef, useState } from 'react';

function ViewerImage({ photo }) {
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  return <div className="about-viewer__image-area" aria-busy={status === 'loading'}>
    {status === 'loading' && <p className="about-viewer__status" role="status">Загружаем фотографию…</p>}
    {status === 'error' ? <div className="about-viewer__status" role="alert">
      <p>Не удалось загрузить фотографию.</p>
      <button type="button" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>Попробовать ещё раз</button>
    </div> : <img key={attempt} src={photo.large} alt={photo.alt}
      className={status === 'loading' ? 'about-viewer__image about-viewer__image--loading' : 'about-viewer__image'}
      onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
  </div>;
}

// Native modal dialog supplies the top layer, inert background and focus trap.
// Like CaseModal, restore the previous body overflow and opening element.
export default function AboutPhotoViewer({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef(null);
  const touch = useRef(null);
  const backdropPress = useRef(false);
  const photo = photos[index];
  const series = photos.length > 1;
  const move = delta => setIndex(current => (current + delta + photos.length) % photos.length);
  useEffect(() => {
    const node = dialog.current;
    const origin = document.activeElement;
    const overflow = document.body.style.overflow;
    const position = { top: window.scrollY, left: window.scrollX, behavior: 'instant' };
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (origin?.isConnected) {
        origin.focus({ preventScroll: true });
        window.scrollTo(position);
      }
    };
  }, []);
  return <dialog ref={dialog} className="about-viewer" aria-labelledby="about-viewer-caption"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={event => { if (backdropPress.current && event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = [...dialog.current.querySelectorAll('button:not([disabled])')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
      if (series && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
      }
    }}>
    <div className="about-viewer__panel"
      onTouchStart={event => { const point = event.touches[0]; touch.current = [point.clientX, point.clientY]; }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={event => {
        if (!touch.current) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - touch.current[0], dy = point.clientY - touch.current[1];
        if (series && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        touch.current = null;
      }}>
      <button type="button" className="about-viewer__close" onClick={onClose} aria-label="Закрыть фотографию" autoFocus>×</button>
      <ViewerImage key={photo.id} photo={photo} />
      <div className="about-viewer__bar">
        {series && <button type="button" onClick={() => move(-1)} aria-label="Предыдущая фотография">←</button>}
        <div className="about-viewer__caption" aria-live="polite"><p id="about-viewer-caption">{photo.caption}</p>{series && <span>{index + 1} / {photos.length}</span>}</div>
        {series && <button type="button" onClick={() => move(1)} aria-label="Следующая фотография">→</button>}
      </div>
    </div>
  </dialog>;
}
