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
 */
export interface HomeScreenshot {
	readonly key: string;
	readonly path: string;
	readonly alt: string;
	readonly width: number;
	readonly height: number;
}

export const HOME_SCREENSHOTS = {
	heroHook: {
		key: 'heroHook',
		path: '/berlin-navigator-multilayer.webp',
		alt: 'navigator.berlin: Berlin-Karte mit Ruhe-und-Luft-Score als Fläche, Versorgungs-Score als Größen-Symbole, S-Bahn-Netz und dem Inspektor für den Pariser Platz',
		width: 1600,
		height: 1354
	},
	kiezFinder: {
		key: 'kiezFinder',
		path: '/berlin-navigator-kiez-finder.webp',
		alt: 'navigator.berlin Kiez-Finder: Panel mit neun Reglern neben der Berlin-Karte, die alle 542 Planungsräume nach Passung für Ruhe, Grün und S-Bahn-Nähe einfärbt',
		width: 1440,
		height: 900
	}
} as const satisfies Record<string, HomeScreenshot>;

export type HomeScreenshotKey = keyof typeof HOME_SCREENSHOTS;
