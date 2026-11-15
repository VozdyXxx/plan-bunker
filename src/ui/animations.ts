import gsap from 'gsap';
import { theme } from './theme';

// Уважение к prefers-reduced-motion: при включённом — мгновенно, без движения.
const reduced =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Target = gsap.TweenTarget;

export const anim = {
  /** Переворот карты при раскрытии. */
  flip(el: Target) {
    return gsap.to(el, { rotationY: 180, duration: reduced ? 0 : theme.dur.slow, ease: 'power2.inOut' });
  },
  /** Появление карты с подсветкой. */
  reveal(el: Target) {
    return gsap.fromTo(
      el,
      { opacity: 0, scale: 0.85, filter: 'brightness(2)' },
      { opacity: 1, scale: 1, filter: 'brightness(1)', duration: reduced ? 0 : theme.dur.base, ease: 'back.out(1.6)' },
    );
  },
  /** Наклон карты за курсором/пальцем (x,y в диапазоне -1..1). */
  tilt(el: Target, x: number, y: number) {
    return gsap.to(el, {
      rotationY: x * 10,
      rotationX: -y * 10,
      duration: reduced ? 0 : theme.dur.fast,
      ease: 'power1.out',
      transformPerspective: 600,
    });
  },
  /** Выбывший уезжает за «дверь бункера». */
  voteOut(el: Target) {
    return gsap.to(el, { x: 320, opacity: 0, duration: reduced ? 0 : theme.dur.slow, ease: 'power3.in' });
  },
  /** Построчный набор текста концовки. */
  endingType(el: Target) {
    return gsap.from(el, { opacity: 0, y: 12, duration: reduced ? 0 : theme.dur.base, ease: 'power2.out' });
  },
};
