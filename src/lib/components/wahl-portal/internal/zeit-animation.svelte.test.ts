import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZeitAnimationController } from './zeit-animation.svelte.js';

const JAHRE = [2016, 2021, 2023];

function makeCtl(overrides: Partial<{ initialJahr: number; reducedMotion: boolean }> = {}) {
	const displayCalls: number[] = [];
	const commitCalls: number[] = [];
	const ctl = new ZeitAnimationController({
		jahre: () => JAHRE,
		initialJahr: overrides.initialJahr ?? 2016,
		onDisplayJahr: (j) => displayCalls.push(j),
		onCommitJahr: (j) => commitCalls.push(j),
		prefersReducedMotion: () => overrides.reducedMotion ?? false
	});
	return { ctl, displayCalls, commitCalls };
}

describe('ZeitAnimationController', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('Play-Durchlauf: rückt jede ~1,5s ein Jahr vor und pausiert automatisch am letzten Jahr', () => {
		const { ctl, displayCalls, commitCalls } = makeCtl();
		ctl.togglePlay();
		expect(ctl.playing).toBe(true);

		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2021);
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2023);
		// Auto-Pause am letzten Jahr, kein weiterer Timer-Lauf.
		expect(ctl.playing).toBe(false);
		vi.advanceTimersByTime(5000);
		expect(ctl.displayJahr).toBe(2023);

		expect(displayCalls).toEqual([2021, 2023]);
		// Play-Kadenz (1,5s) liegt weit über der Drossel-Schwelle: jeder Schritt
		// committed sofort, das letzte Jahr landet garantiert.
		expect(commitCalls).toEqual([2021, 2023]);
	});

	it('Pause stoppt den Timer, ein erneuter Play-Klick setzt fort', () => {
		const { ctl } = makeCtl();
		ctl.togglePlay();
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2021);
		ctl.togglePlay();
		expect(ctl.playing).toBe(false);
		vi.advanceTimersByTime(3000);
		expect(ctl.displayJahr).toBe(2021);

		ctl.togglePlay();
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2023);
	});

	it('Play beim letzten Jahr startet von vorn statt ein toter Button zu sein', () => {
		const { ctl } = makeCtl({ initialJahr: 2023 });
		ctl.togglePlay();
		expect(ctl.playing).toBe(true);
		expect(ctl.displayJahr).toBe(2016);
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2021);
	});

	it('togglePlay pausiert zuerst, auch wenn reducedMotion inzwischen true ist (Pause bleibt immer möglich)', () => {
		const { ctl } = makeCtl();
		ctl.togglePlay();
		expect(ctl.playing).toBe(true);
		ctl.reducedMotion = true;
		ctl.togglePlay();
		expect(ctl.playing).toBe(false);
		expect(ctl.displayJahr).toBe(2016);
	});

	it('Reduced Motion: Play-Klick steppt genau ein Jahr weiter, kein Timer', () => {
		const { ctl, displayCalls } = makeCtl({ reducedMotion: true });
		ctl.togglePlay();
		expect(ctl.playing).toBe(false);
		expect(ctl.displayJahr).toBe(2021);
		vi.advanceTimersByTime(10000);
		// Kein Timer: ohne weiteren Klick bleibt es beim einen Schritt.
		expect(ctl.displayJahr).toBe(2021);
		ctl.togglePlay();
		expect(ctl.displayJahr).toBe(2023);
		expect(displayCalls).toEqual([2021, 2023]);
	});

	it('Reduced Motion: am letzten Jahr tut ein weiterer Klick nichts', () => {
		const { ctl } = makeCtl({ reducedMotion: true, initialJahr: 2023 });
		ctl.togglePlay();
		expect(ctl.displayJahr).toBe(2023);
	});

	it('Slider-Drag: setzt das Anzeige-Jahr sofort und pausiert eine laufende Wiedergabe', () => {
		const { ctl, displayCalls } = makeCtl();
		ctl.togglePlay();
		ctl.setDisplayJahrByIndex(2);
		expect(ctl.playing).toBe(false);
		expect(ctl.displayJahr).toBe(2023);
		expect(displayCalls).toContain(2023);
	});

	it('Drossel: schnelle Drag-Ticks committen höchstens alle ~350ms, das letzte Jahr landet per Trailing-Timer', () => {
		const { ctl, commitCalls } = makeCtl();
		ctl.setDisplayJahrByIndex(1); // t=0: sofortiger Commit (elapsed seit 0 >= Schwelle im ersten Aufruf)
		expect(commitCalls).toEqual([2021]);

		vi.advanceTimersByTime(50);
		ctl.setDisplayJahrByIndex(2); // innerhalb des Drossel-Fensters: kein sofortiger Commit
		expect(commitCalls).toEqual([2021]);
		expect(ctl.displayJahr).toBe(2023);

		// flush() INNERHALB des Drossel-Fensters committet NICHT sofort -- der
		// bereits laufende Trailing-Timer bleibt stehen und committed später.
		ctl.flushPendingCommit();
		expect(commitCalls).toEqual([2021]);

		vi.advanceTimersByTime(300);
		expect(commitCalls).toEqual([2021, 2023]);
	});

	it('destroy() cancelt einen ausstehenden gedrosselten Commit ersatzlos (kein setJahr/goto nach dem Teardown)', () => {
		const { ctl, commitCalls } = makeCtl();
		ctl.setDisplayJahrByIndex(1);
		vi.advanceTimersByTime(50);
		ctl.setDisplayJahrByIndex(2);
		expect(commitCalls).toEqual([2021]);
		ctl.destroy();
		vi.advanceTimersByTime(1000);
		expect(commitCalls).toEqual([2021]);
	});

	it('syncExternalJahr übernimmt externe Änderungen nur außerhalb der Wiedergabe', () => {
		const { ctl, displayCalls } = makeCtl();
		ctl.syncExternalJahr(2021);
		expect(ctl.displayJahr).toBe(2021);
		expect(displayCalls).toEqual([2021]);

		ctl.togglePlay();
		ctl.syncExternalJahr(2016);
		// Externe Änderung während der Wiedergabe pausiert und übernimmt das
		// Jahr, statt drei verschiedene Jahre (Karte/Slider/Timer) stehen zu
		// lassen.
		expect(ctl.playing).toBe(false);
		expect(ctl.displayJahr).toBe(2016);
	});

	it('syncExternalJahr ignoriert ein Jahr, das bereits dem Anzeige-Jahr entspricht (Eigen-Commits während Play)', () => {
		const { ctl } = makeCtl();
		ctl.togglePlay();
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2021);
		expect(ctl.playing).toBe(true);
		// Der eigene Commit-Roundtrip liefert dasselbe Jahr zurück -- kein Pause.
		ctl.syncExternalJahr(2021);
		expect(ctl.playing).toBe(true);
	});

	it('Reihen-Wechsel während Play: der Tick pausiert, statt auf jahre[0] der neuen Reihe zu springen', () => {
		let jahre: readonly number[] = JAHRE;
		const displayCalls: number[] = [];
		const ctl = new ZeitAnimationController({
			jahre: () => jahre,
			initialJahr: 2016,
			onDisplayJahr: (j) => displayCalls.push(j),
			onCommitJahr: () => {},
			prefersReducedMotion: () => false
		});
		ctl.togglePlay();
		vi.advanceTimersByTime(1500);
		expect(ctl.displayJahr).toBe(2021);
		// Reihen-Wechsel: das aktuelle Anzeige-Jahr existiert in der neuen Liste
		// nicht mehr.
		jahre = [2017, 2022];
		vi.advanceTimersByTime(1500);
		expect(ctl.playing).toBe(false);
		expect(ctl.displayJahr).toBe(2021);
	});

	describe('reduced-motion (echtes matchMedia, kein Injection-Override)', () => {
		function makeMatchMedia(initialMatches: boolean) {
			let matches = initialMatches;
			let onChange: ((event: MediaQueryListEvent) => void) | null = null;
			const mql = {
				get matches() {
					return matches;
				},
				addEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
					onChange = handler;
				},
				removeEventListener: vi.fn(() => {
					onChange = null;
				})
			} as unknown as MediaQueryList;
			return {
				mql,
				fire: (next: boolean) => {
					matches = next;
					onChange?.({ matches: next } as MediaQueryListEvent);
				}
			};
		}

		it('liest den Initialwert aus matchMedia und reagiert reaktiv auf einen change-Event', () => {
			const { mql, fire } = makeMatchMedia(false);
			const matchMediaSpy = vi.fn().mockReturnValue(mql);
			vi.stubGlobal('matchMedia', matchMediaSpy);

			const ctl = new ZeitAnimationController({
				jahre: () => JAHRE,
				initialJahr: 2016,
				onDisplayJahr: () => {},
				onCommitJahr: () => {}
			});
			expect(ctl.reducedMotion).toBe(false);
			fire(true);
			expect(ctl.reducedMotion).toBe(true);

			ctl.destroy();
			expect(mql.removeEventListener).toHaveBeenCalled();
			vi.unstubAllGlobals();
		});
	});
});
