import React, { useEffect, useState, useRef } from 'react';

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

export const CustomCursorAndRipple: React.FC = () => {
  return null;
};

/**
 * Interactive 3D Card Tilt wrapper (Desktop hover-capable devices only)
 */
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: number;
}> = ({ children, className = '', onClick, intensity = 5 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(2px)`
    );
  };

  const handleMouseLeave = () => {
    setTransformStyle('');
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={transformStyle ? { transform: transformStyle } : undefined}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Magnetic Button wrapper for Hero CTAs
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit';
}> = ({ children, className = '', onClick, href, target, rel, type = 'button' }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
    setOffset({ x: dx, y: dy });
  };

  const handleLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  const style =
    offset.x !== 0 || offset.y !== 0
      ? { transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)` }
      : undefined;

  if (href) {
    return (
      <a
        ref={(el) => {
          ref.current = el;
        }}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={style}
        className={`transition-transform duration-150 ease-out ${className}`}
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
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
      className={`transition-transform duration-150 ease-out ${className}`}
    >
      {children}
    </button>
  );
};
