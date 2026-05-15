const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
	return nodes.filter((el) => {
		if (el.hasAttribute('disabled')) return false;
		if (el.getAttribute('tabindex') === '-1') return false;
		const rect = el.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0 && el.offsetParent === null) {
			if (typeof document !== 'undefined' && document.body.contains(el)) {
				return true;
			}
			return false;
		}
		return true;
	});
}

export interface FocusTrap {
	handleKeydown: (e: KeyboardEvent) => void;
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
	return {
		handleKeydown(e: KeyboardEvent): void {
			if (e.key !== 'Tab') return;
			const focusables = getFocusableElements(container);
			if (focusables.length === 0) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement as HTMLElement | null;
			if (e.shiftKey) {
				if (active === first || !container.contains(active)) {
					e.preventDefault();
					last?.focus();
				}
			} else if (active === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	};
}
