/**
 * Story 2.12 T2: Screenshot-Asset-Manifest für die Home-Landing.
 *
 * Hardcoded Pfade auf Files unter `static/`. File-Existenz-Test in
 * `screenshot-manifest.test.ts` lässt den Build fallen wenn ein Asset
 * fehlt — verhindert silent-404 in Production.
 *
 * Pipeline-Hinweis: Originals als PNG/JPG manuell aufnehmen, dann via
 * `cwebp -q 82` konvertieren und das `.webp` im Manifest referenzieren.
 * Runbook in `docs/runbooks/atlas-screenshot-workflow.md`.
 *
 * i18n Block B2: `alt` ist echter UI-Text (Bildbeschreibung) und wird über
 * `homeScreenshotAlt()` locale-abhängig aufgelöst statt als Modul-Konstante
 * geführt.
 */
import { m } from '$lib/paraglide/messages.js';
import {
	toMessageOptions,
	assertUnreachable,
	type LocaleOptions
} from '$lib/i18n/message-options.js';

export interface HomeScreenshot {
	readonly key: string;
	readonly path: string;
	readonly width: number;
	readonly height: number;
}

export const HOME_SCREENSHOTS = {
	heroHook: {
		key: 'heroHook',
		path: '/berlin-navigator-multilayer.webp',
		width: 1600,
		height: 1354
	},
	kiezFinder: {
		key: 'kiezFinder',
		path: '/berlin-navigator-kiez-finder.webp',
		width: 1440,
		height: 900
	}
} as const satisfies Record<string, HomeScreenshot>;

export type HomeScreenshotKey = keyof typeof HOME_SCREENSHOTS;

export function homeScreenshotAlt(key: HomeScreenshotKey, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (key) {
		case 'heroHook':
			return m.home_screenshot_hero_hook_alt(undefined, options);
		case 'kiezFinder':
			return m.home_screenshot_kiez_finder_alt(undefined, options);
		default:
			return assertUnreachable(key);
	}
}
