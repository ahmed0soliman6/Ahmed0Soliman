import React, { useEffect, useRef, useState } from 'react';

interface RipplePoint {
  id: number;
  x: number;
  y: number;
}

/**
 * High-performance Custom Cursor & Click Ripple (PROMPT 5.3):
 * - Strictly disabled on touch/mobile/coarse-pointer devices ((hover: hover) and (pointer: fine))
 * - Strictly disabled when user has prefers-reduced-motion: reduce enabled
 * - Uses direct DOM ref + requestAnimationFrame for cursor translation to cause 0 React re-renders on mousemove
 */
export const CustomCursorAndRipple: React.FC = () => {
  const cursorOuterRef = useRef<HTMLDivElement | null>(null);
  const cursorInnerRef = useRef<HTMLDivElement | null>(null);
  const [enabledDesktopCursor, setEnabledDesktopCursor] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ripples, setRipples] = useState<RipplePoint[]>([]);

  useEffect(() => {
    const fineHoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateCapabilities = () => {
      setEnabledDesktopCursor(fineHoverQuery.matches && !motionQuery.matches);
      setReducedMotion(motionQuery.matches);
    };

    updateCapabilities();

    let rafId: number | null = null;
    let lastX = -100;
    let lastY = -100;
    let lastHoverInteractive = false;

    const handlePointerMove = (e: MouseEvent) => {
      if (!fineHoverQuery.matches || motionQuery.matches) return;
      lastX = e.clientX;
      lastY = e.clientY;
      const target = e.target as HTMLElement | null;
      lastHoverInteractive = Boolean(
        target?.closest('a, button, input, select, textarea, label, [role="button"]')
      );

      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          if (cursorOuterRef.current) {
            cursorOuterRef.current.style.transform = `translate3d(${lastX}px, ${lastY}px, 0)`;
            cursorOuterRef.current.style.opacity = '1';
          }
          if (cursorInnerRef.current) {
            if (lastHoverInteractive) {
              cursorInnerRef.current.className =
                'rounded-full border transition-all duration-150 w-9 h-9 border-[#00C2CB] bg-[#00C2CB]/10 scale-110';
            } else {
              cursorInnerRef.current.className =
                'rounded-full border transition-all duration-150 w-5 h-5 border-[#00C2CB]/50 bg-transparent';
            }
          }
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (motionQuery.matches) return;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 450);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handleClick, { passive: true });
    fineHoverQuery.addEventListener?.('change', updateCapabilities);
    motionQuery.addEventListener?.('change', updateCapabilities);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handleClick);
      fineHoverQuery.removeEventListener?.('change', updateCapabilities);
      motionQuery.removeEventListener?.('change', updateCapabilities);
    };
  }, []);

  if (reducedMotion) return null;

  return (
    <>
      {enabledDesktopCursor && (
        <div
          ref={cursorOuterRef}
          aria-hidden="true"
          style={{
            transform: 'translate3d(-100px, -100px, 0)',
            opacity: 0,
            willChange: 'transform',
          }}
          className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        >
          <div
            ref={cursorInnerRef}
            className="rounded-full border transition-all duration-150 w-5 h-5 border-[#00C2CB]/50 bg-transparent"
          />
        </div>
      )}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          style={{ left: ripple.x, top: ripple.y }}
          className="click-ripple-circle"
        />
      ))}
    </>
  );
};
