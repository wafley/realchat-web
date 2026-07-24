import { useEffect, useState } from 'react';

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const initialHeight = vv.height;

    const handler = () => {
      const diff = initialHeight - vv.height;
      if (diff > 100) {
        setHeight(diff);
      } else {
        setHeight(0);
      }
    };

    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

  return height;
}
