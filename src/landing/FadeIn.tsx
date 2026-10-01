import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay in ms
  direction?: 'up' | 'down' | 'none';
  distance?: number; // distance in px
  duration?: number; // duration in ms
  threshold?: number;
  rootMargin?: string;
}

/**
 * FadeIn Component
 * Menggunakan Intersection Observer API untuk menganimasikan elemen secara halus
 * (gentle fade-in + slight slide) saat pengguna menggulir halaman ke bawah.
 * Mendukung prefers-reduced-motion dan hanya memicu sekali (unobserve saat terlihat).
 */
export default function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 24,
  duration = 750,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cek preferensi aksesibilitas pengguna
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // Jika IntersectionObserver tidak didukung, langsung tampilkan
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const currentElem = domRef.current;
    if (!currentElem) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentElem);

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [threshold, rootMargin]);

  // Hitung transformasi awal
  let initialTransform = 'none';
  if (direction === 'up') initialTransform = `translateY(${distance}px)`;
  if (direction === 'down') initialTransform = `translateY(-${distance}px)`;

  const transitionStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : initialTransform,
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={domRef} style={transitionStyle} className={className}>
      {children}
    </div>
  );
}
