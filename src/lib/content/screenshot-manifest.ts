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
		path: '/berlin-navigator-laermbelastung2.webp',
		alt: 'Karten-Ansicht von navigator.berlin mit aktiver Lärmbelastungs-Schicht',
		width: 1200,
		height: 630
	}
} as const satisfies Record<string, HomeScreenshot>;

export type HomeScreenshotKey = keyof typeof HOME_SCREENSHOTS;
