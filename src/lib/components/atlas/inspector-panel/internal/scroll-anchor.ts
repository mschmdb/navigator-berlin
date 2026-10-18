/**
 * Hält die Leseposition im Inspector, wenn der Pin auf eine neue Adresse
 * springt (#150). Statt fester Pixel merkt sich der Inspector den obersten
 * sichtbaren Block (`data-scroll-anchor`) samt Versatz und stellt ihn nach dem
 * Neuaufbau wieder an dieselbe Stelle. Score, Wahl und Demografie laden
 * asynchron nach und verschieben dabei den Inhalt; der Keeper gleicht das aus,
 * bis die Person selbst scrollt.
 */

export interface AnchorPoint {
	/** Wert von `data-scroll-anchor`, z. B. `hit:laerm-2023` oder `section:umwelt`. */
	readonly key: string;
	/** Abstand der Block-Oberkante zur Container-Oberkante in px (negativ = ragt darüber). */
	readonly offset: number;
}

/** Innerster Anker zuerst, danach die umschließenden als Rückfall. */
export type ScrollAnchor = readonly AnchorPoint[];

const ATTR = 'data-scroll-anchor';

function relativeTop(container: HTMLElement, el: Element): number {
	return el.getBoundingClientRect().top - container.getBoundingClientRect().top;
}

function cssEscape(value: string): string {
	return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

/**
 * Oberster sichtbarer Block an der Container-Oberkante. `null`, wenn der
 * Container ganz oben steht: dann soll die neue Adresse ebenfalls oben starten.
 */
export function captureScrollAnchor(container: HTMLElement): ScrollAnchor | null {
	if (container.scrollTop <= 0) return null;
	const containerRect = container.getBoundingClientRect();
	const candidates = Array.from(container.querySelectorAll<HTMLElement>(`[${ATTR}]`));

	// Innerster Block, der die Oberkante schneidet; sonst der erste darunter.
	let picked: HTMLElement | null = null;
	for (const el of candidates) {
		const rect = el.getBoundingClientRect();
		if (rect.height === 0) continue;
		if (rect.top <= containerRect.top + 1 && rect.bottom > containerRect.top) picked = el;
	}
	if (!picked) {
		picked =
			candidates.find((el) => {
				const rect = el.getBoundingClientRect();
				return rect.height > 0 && rect.top > containerRect.top;
			}) ?? null;
	}
	if (!picked) return null;

	const chain: AnchorPoint[] = [];
	let node: HTMLElement | null = picked;
	while (node && node !== container) {
		const key = node.getAttribute(ATTR);
		if (key) chain.push({ key, offset: relativeTop(container, node) });
		node = node.parentElement?.closest<HTMLElement>(`[${ATTR}]`) ?? null;
		if (node && !container.contains(node)) break;
	}
	return chain;
}

/**
 * Scrollt so, dass der erste noch vorhandene Anker der Kette wieder an seinem
 * gemerkten Versatz steht. `false`, wenn keiner mehr existiert.
 */
export function restoreScrollAnchor(container: HTMLElement, anchor: ScrollAnchor): boolean {
	for (const [index, point] of anchor.entries()) {
		const el = container.querySelector(`[${ATTR}="${cssEscape(point.key)}"]`);
		if (!el) continue;
		// Rückfall auf einen umschließenden Block: dessen Anfang oben zeigen, sonst
		// schiebt der alte Versatz einen kürzeren Abschnitt ganz über die Kante.
		const offset = index === 0 ? point.offset : Math.max(point.offset, 0);
		const delta = relativeTop(container, el) - offset;
		if (Math.abs(delta) >= 1) container.scrollTop += delta;
		return true;
	}
	return false;
}

/** Nächster scrollbarer Vorfahre (inklusive des Elements selbst). */
export function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
	let node: HTMLElement | null = el;
	while (node) {
		const overflowY = getComputedStyle(node).overflowY;
		if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
			return node;
		}
		node = node.parentElement;
	}
	return null;
}

export interface AnchorKeeper {
	/** Stellt den Anker erneut her, solange der Keeper aktiv ist. */
	reapply(): void;
	stop(): void;
	readonly active: boolean;
}

const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/**
 * Hält den Anker, während Inhalt nachlädt. Endet bei eigener Scroll-Geste der
 * Person oder nach `maxMs`. Mit `observe` übernimmt ein ResizeObserver das
 * Nachführen, sonst ruft der Aufrufer `reapply()`.
 */
export function createAnchorKeeper(
	container: HTMLElement,
	anchor: ScrollAnchor,
	options: { maxMs?: number; observe?: Element | null } = {}
): AnchorKeeper {
	let active = true;
	const stop = () => {
		if (!active) return;
		active = false;
		for (const type of USER_SCROLL_EVENTS) container.removeEventListener(type, stop);
		observer?.disconnect();
		clearTimeout(timer);
	};
	for (const type of USER_SCROLL_EVENTS) {
		container.addEventListener(type, stop, { passive: true });
	}
	const timer = setTimeout(stop, options.maxMs ?? 4000);
	const reapply = () => {
		if (active) restoreScrollAnchor(container, anchor);
	};
	const observer =
		options.observe && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reapply) : null;
	if (observer && options.observe) observer.observe(options.observe);
	reapply();
	return {
		reapply,
		stop,
		get active() {
			return active;
		}
	};
}
