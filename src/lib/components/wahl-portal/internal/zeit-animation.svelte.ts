/**
 * Story 7 (Zeit-Animation): Controller für die Zeit-Leiste unter der
 * Winner-Map (kiez/bezirk, Boundary: nie auf Stimmbezirk). Hält das lokale
 * Anzeige-Jahr (jeder Slider-Tick/Play-Schritt aktualisiert es sofort, für
 * die Karten-Umfärbung), und committed es gedrosselt (`onCommitJahr`, max.
 * ~3 Aufrufe/Sekunde) an den Portal-State, damit ein Drag keine URL-Flut
 * auslöst (Boundary: "höchstens ~3 URL-Writes pro Sekunde"). Das finale
 * Jahr landet garantiert: `flushPendingCommit()` (Drag-Ende) committed sofort
 * NUR außerhalb des Drossel-Fensters -- innerhalb lässt sie den bereits
 * laufenden Trailing-Timer stehen (der committed garantiert das letzte
 * Jahr); `destroy()` (Unmount) cancelt einen ausstehenden Commit ersatzlos
 * (kein `setJahr`/`goto` mehr nach dem Teardown).
 *
 * `prefers-reduced-motion: reduce` (reaktives matchMedia-Muster wie
 * `pixel-logo.svelte`): kein Timer-Lauf, der Play-Klick steppt genau ein
 * Jahr weiter. Der Zustand ist ein öffentliches `$state`-Feld (die
 * Komponente zeigt im Step-Modus ein anderes Icon/Label), mit Listener auf
 * Änderungen; eine injizierte `prefersReducedMotion`-Option (Tests) ersetzt
 * die matchMedia-Verdrahtung vollständig durch ihren (einmalig gelesenen)
 * Rückgabewert.
 */

const INTERVAL_MS = 1500;
/** < 1000/3 ms: garantiert höchstens ~3 Commits/Sekunde. */
const COMMIT_THROTTLE_MS = 350;

export interface ZeitAnimationOptions {
	/** Aufsteigend sortierte, reale Jahre mit Kiez/Bezirk-Daten. */
	readonly jahre: () => readonly number[];
	readonly initialJahr: number;
	/** Sofort bei jeder visuellen Änderung (Karten-Umfärbung). */
	readonly onDisplayJahr: (jahr: number) => void;
	/** Gedrosselt; das zuletzt gesetzte Jahr landet garantiert. */
	readonly onCommitJahr: (jahr: number) => void;
	/** Injizierbar für Tests; Default = reaktives `matchMedia`. */
	readonly prefersReducedMotion?: () => boolean;
}

export class ZeitAnimationController {
	displayJahr = $state(0);
	playing = $state(false);
	reducedMotion = $state(false);

	#jahre: () => readonly number[];
	#onDisplayJahr: (jahr: number) => void;
	#onCommitJahr: (jahr: number) => void;
	#timer: ReturnType<typeof setInterval> | null = null;
	#lastCommitAt = 0;
	#pendingCommitTimer: ReturnType<typeof setTimeout> | null = null;
	#pendingCommitJahr: number | null = null;
	#mediaQuery: MediaQueryList | null = null;
	#onMediaChange: ((event: MediaQueryListEvent) => void) | null = null;

	constructor(opts: ZeitAnimationOptions) {
		this.#jahre = opts.jahre;
		this.displayJahr = opts.initialJahr;
		this.#onDisplayJahr = opts.onDisplayJahr;
		this.#onCommitJahr = opts.onCommitJahr;
		if (opts.prefersReducedMotion) {
			// Injizierte Option ersetzt Initialwert UND Reaktivität sinnvoll:
			// ein statischer Test-Wert braucht keine echte matchMedia-Verdrahtung.
			this.reducedMotion = opts.prefersReducedMotion();
			return;
		}
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			const query = window.matchMedia('(prefers-reduced-motion: reduce)');
			this.reducedMotion = query.matches;
			this.#mediaQuery = query;
			this.#onMediaChange = (event) => {
				this.reducedMotion = event.matches;
			};
			query.addEventListener('change', this.#onMediaChange);
		}
	}

	/** Externe Jahr-Änderung (Steuerleiste-Chip, Reihen-Wechsel) übernehmen --
	 * pausiert eine laufende Wiedergabe statt sie zu ignorieren, damit Karte/
	 * Slider/Timer nie auf unterschiedlichen Jahren stehen. */
	syncExternalJahr(jahr: number): void {
		if (jahr === this.displayJahr) return;
		if (this.playing) this.pause();
		this.displayJahr = jahr;
		this.#onDisplayJahr(jahr);
	}

	/** Slider-Drag: Index in die aufsteigende Jahres-Liste. */
	setDisplayJahrByIndex(index: number): void {
		const jahr = this.#jahre()[index];
		if (jahr === undefined) return;
		this.pause();
		this.#setDisplay(jahr);
	}

	/** Play/Pause-Button. Reduced Motion: genau ein Jahr weiter, kein Timer. */
	togglePlay(): void {
		if (this.playing) {
			this.pause();
			return;
		}
		if (this.reducedMotion) {
			this.#stepOnce();
			return;
		}
		this.#play();
	}

	pause(): void {
		if (this.#timer !== null) {
			clearInterval(this.#timer);
			this.#timer = null;
		}
		this.playing = false;
	}

	/** Drag-Ende (`change`-Event): committed das finale Jahr sofort, WENN das
	 * Drossel-Fenster bereits abgelaufen ist. Innerhalb des Fensters lässt sie
	 * den ohnehin laufenden Trailing-Timer stehen -- der committed garantiert
	 * dasselbe Jahr, ohne die Drossel zu umgehen (gehaltene Pfeiltaste feuert
	 * sonst bis zu ~30 Commits/Sekunde statt der erlaubten ~3). */
	flushPendingCommit(): void {
		if (this.#pendingCommitTimer === null) return;
		const elapsed = Date.now() - this.#lastCommitAt;
		if (elapsed < COMMIT_THROTTLE_MS) return;
		clearTimeout(this.#pendingCommitTimer);
		this.#pendingCommitTimer = null;
		this.#lastCommitAt = Date.now();
		const pending = this.#pendingCommitJahr;
		this.#pendingCommitJahr = null;
		if (pending !== null) this.#onCommitJahr(pending);
	}

	/** Unmount-Garantie: cancelt einen ausstehenden gedrosselten Commit
	 * ersatzlos (kein `setJahr`/`goto` mehr nach dem Teardown der Komponente). */
	destroy(): void {
		this.pause();
		if (this.#pendingCommitTimer !== null) {
			clearTimeout(this.#pendingCommitTimer);
			this.#pendingCommitTimer = null;
		}
		this.#pendingCommitJahr = null;
		if (this.#mediaQuery && this.#onMediaChange) {
			this.#mediaQuery.removeEventListener('change', this.#onMediaChange);
			this.#mediaQuery = null;
			this.#onMediaChange = null;
		}
	}

	#indexOf(jahr: number): number {
		return this.#jahre().indexOf(jahr);
	}

	#stepOnce(): void {
		const jahre = this.#jahre();
		const next = jahre[this.#indexOf(this.displayJahr) + 1];
		if (next === undefined) return;
		this.#setDisplay(next);
	}

	#play(): void {
		const jahre = this.#jahre();
		const idx = this.#indexOf(this.displayJahr);
		if (idx === -1) return;
		if (idx >= jahre.length - 1) {
			// Play am letzten Jahr ist kein toter Button: startet von vorn statt
			// still zurückzukehren.
			if (jahre.length < 2) return;
			this.#setDisplay(jahre[0]);
		}
		this.playing = true;
		this.#timer = setInterval(() => {
			const jahreNow = this.#jahre();
			const idxNow = this.#indexOf(this.displayJahr);
			// Reihen-Wechsel während Play: das aktuelle Anzeige-Jahr existiert in
			// der neuen Jahres-Liste nicht mehr -- pausieren statt auf jahre[0]
			// zu springen.
			if (idxNow === -1) {
				this.pause();
				return;
			}
			const next = jahreNow[idxNow + 1];
			if (next === undefined) {
				this.pause();
				return;
			}
			this.#setDisplay(next);
			if (idxNow + 1 >= jahreNow.length - 1) this.pause();
		}, INTERVAL_MS);
	}

	#setDisplay(jahr: number): void {
		this.displayJahr = jahr;
		this.#onDisplayJahr(jahr);
		this.#commitThrottled(jahr);
	}

	#commitThrottled(jahr: number): void {
		const now = Date.now();
		const elapsed = now - this.#lastCommitAt;
		if (this.#pendingCommitTimer !== null) {
			clearTimeout(this.#pendingCommitTimer);
			this.#pendingCommitTimer = null;
		}
		if (elapsed >= COMMIT_THROTTLE_MS) {
			this.#lastCommitAt = now;
			this.#pendingCommitJahr = null;
			this.#onCommitJahr(jahr);
			return;
		}
		this.#pendingCommitJahr = jahr;
		this.#pendingCommitTimer = setTimeout(() => {
			this.#pendingCommitTimer = null;
			this.#lastCommitAt = Date.now();
			const pending = this.#pendingCommitJahr;
			this.#pendingCommitJahr = null;
			if (pending !== null) this.#onCommitJahr(pending);
		}, COMMIT_THROTTLE_MS - elapsed);
	}
}
