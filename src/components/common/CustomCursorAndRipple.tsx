import React, { useEffect, useRef } from 'react';

/**
 * Checks whether interactive desktop pointer effects should be active.
 * Automatically disabled on touch devices and when prefers-reduced-motion is enabled.
 */
export function canRunFinePointerEffects(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  const hasFineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return hasFineHover && !reducedMotion;
}

/**
 * Preserves the native system cursor without adding an intrusive custom cursor overlay.
 */
export const CustomCursorAndRipple: React.FC = () => {
  return null;
};

/**
 * High-performance 3D Card Tilt + Pointer CSS Variables wrapper.
 * - Updates DOM CSS variables via requestAnimationFrame (0 React state re-renders on move).
 * - Clamps tilt strictly to max 3deg.
 * - Exposes --card-px / --card-py (-1..1) for child image parallax and --glow-x / --glow-y for border glow.
 * - Desktop fine pointer only; respects prefers-reduced-motion.
 */
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: number;
  enableBorderGlow?: boolean;
}> = ({ children, className = '', onClick, intensity = 3, enableBorderGlow = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const maxTilt = Math.min(Math.max(intensity, 0), 3);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !canRunFinePointerEffects()) return;
    const el = ref.current;
    if (!el) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const normX = Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (y / rect.height) * 2 - 1));

      const rotateX = (-normY * maxTilt).toFixed(2);
      const rotateY = (normX * maxTilt).toFixed(2);

      el.style.setProperty('--card-px', normX.toFixed(3));
      el.style.setProperty('--card-py', normY.toFixed(3));
      el.style.setProperty('--glow-x', `${x.toFixed(1)}px`);
      el.style.setProperty('--glow-y', `${y.toFixed(1)}px`);
      el.style.setProperty('--glow-opacity', '1');
      el.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });
  };

  const resetPointer = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--card-px', '0');
    el.style.setProperty('--card-py', '0');
    el.style.setProperty('--glow-opacity', '0');
    el.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${(e.clientX - rect.left).toFixed(1)}px`);
    el.style.setProperty('--glow-y', `${(e.clientY - rect.top).toFixed(1)}px`);
    el.style.setProperty('--press-scale', '0.988');
  };

  const handlePointerUp = () => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty('--press-scale');
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        resetPointer();
        handlePointerUp();
      }}
      onPointerCancel={() => {
        resetPointer();
        handlePointerUp();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`relative transition-[transform,box-shadow,border-color] duration-200 ease-out active:scale-[0.988] ${className}`}
    >
      {enableBorderGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-20"
          style={{
            opacity: 'var(--glow-opacity, 0)',
            background:
              'radial-gradient(360px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(0, 212, 255, 0.34), rgba(56, 189, 248, 0.08) 45%, transparent 72%)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1.5px',
          }}
        />
      )}
      {children}
    </div>
  );
};

/**
 * Magnetic Button wrapper for primary interactive CTAs.
 * - Zero React state updates on pointer move (rAF + direct DOM transform).
 * - Desktop fine pointer only; disabled when prefers-reduced-motion is active.
 * - Built-in tactile click feedback on pointer press.
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  strength?: number;
}> = ({
  children,
  className = '',
  onClick,
  href,
  target,
  rel,
  type = 'button',
  ariaLabel,
  strength = 0.18,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !canRunFinePointerEffects()) return;
    const el = ref.current;
    if (!el) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const rawDx = (clientX - (rect.left + rect.width / 2)) * strength;
      const rawDy = (clientY - (rect.top + rect.height / 2)) * strength;
      const dx = Math.max(-7, Math.min(7, rawDx));
      const dy = Math.max(-7, Math.min(7, rawDy));
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    });
  };

  const resetMagnetic = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate3d(0px, 0px, 0)';
  };

  const handlePointerDown = () => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.style.transform = 'translate3d(0px, 0px, 0) scale(0.96)';
  };

  const handlePointerUp = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
  };

  const sharedClass = `transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-out active:scale-[0.96] will-change-transform ${className}`;

  if (href) {
    return (
      <a
        ref={(el) => {
          ref.current = el;
        }}
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          resetMagnetic();
          handlePointerUp();
        }}
        onPointerCancel={resetMagnetic}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={sharedClass}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={(el) => {
        ref.current = el;
      }}
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        resetMagnetic();
        handlePointerUp();
      }}
      onPointerCancel={resetMagnetic}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={sharedClass}
    >
      {children}
    </button>
  );
};
