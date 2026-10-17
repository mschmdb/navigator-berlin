/**
 * Reduced Motion für JS-Bewegung (#91). Die globale CSS-Regel in app.css erreicht
 * Smooth-Scroll per `scrollIntoView` und animierte Karten-Sprünge nicht.
 */

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollBehavior(): ScrollBehavior {
	return prefersReducedMotion() ? 'auto' : 'smooth';
}
