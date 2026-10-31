/**
 * Startseiten-Vorschauen aus der echten App (#170): öffnet feste Zustände im
 * laufenden Dev-Server, nimmt Ausschnitte auf und speichert WebP nach
 * `static/home/`. So zeigt die Startseite immer, was Nutzer wirklich bekommen.
 *
 * Läuft nur lokal: MapLibre braucht WebGL, darum ein sichtbares Chrome-Fenster
 * (headless rendert die Karte nicht). Nicht für die CI.
 *
 * Aufruf: `pnpm dev` starten, dann `pnpm screenshots [--base http://localhost:5173]`.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import sharp from 'sharp';
import { HOME_PREVIEW_LOCALES, HOME_PREVIEWS } from '../src/lib/content/home-previews.js';

const BASE = process.argv.includes('--base')
	? process.argv[process.argv.indexOf('--base') + 1]
	: 'http://localhost:5173';
const OUT = join(process.cwd(), 'static/home');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1440, height: 900 };
const HEADER = 72;
const FOOTER = 38;
const SETTLE_MS = 5000;

interface Shot {
	readonly name: string;
	readonly path: string;
	/** Zustand nach dem Laden herstellen, z. B. Regler verstellen. */
	readonly prepare?: (page: Page) => Promise<void>;
	/** Zielbreite in px; Default 1600. Kachel-Bilder (#171) sind 1200 breit. */
	readonly width?: number;
	/** Ausschnitt; Default: Karte und Panel ohne Kopf- und Fußzeile. */
	readonly clip?: (page: Page) => Promise<{ x: number; y: number; width: number; height: number }>;
}

const fullMap = async () => ({
	x: 0,
	y: HEADER,
	width: VIEWPORT.width,
	height: VIEWPORT.height - HEADER - FOOTER
});

/** Kartenteil links mit Legende (ohne Panel rechts), Seitenverhältnis 6:5. */
const hitzeTile = async () => {
	const height = VIEWPORT.height - HEADER - FOOTER;
	return { x: 0, y: HEADER, width: Math.round((height * 6) / 5), height };
};

const SHOTS: readonly Shot[] = [
	{
		name: 'hitze',
		path: HOME_PREVIEWS.hitze.path,
		width: 1200,
		clip: hitzeTile
	},
	{
		name: 'kiez-score',
		path: HOME_PREVIEWS['kiez-score'].path,
		prepare: async (page) => {
			// Ganz Berlin zeigen: nach dem Sprung zur Adresse herauszoomen (Matze 31.10.:
			// dieses Bild bleibt, auch wenn der Link in der Adressansicht öffnet).
			const zoomOut = page
				.getByRole('button', { name: /zoom out|herauszoomen|verkleinern/i })
				.first();
			for (let k = 0; k < 4; k++) {
				await zoomOut.click();
				await page.waitForTimeout(700);
			}
			// Maus auf den Panel-Titel, damit kein Karten-Tooltip im Bild steht.
			await page.mouse.move(1300, 110);
			await page.waitForTimeout(800);
		}
	},
	{
		name: 'finder',
		path: HOME_PREVIEWS.finder.path
	},
	{
		name: 'wahlen',
		path: HOME_PREVIEWS.wahlen.path,
		width: 1200,
		clip: async (page) => {
			const map = page.locator('.maplibregl-map').first();
			await map.scrollIntoViewIfNeeded();
			// Sticky-Kopfzeile ausblenden, damit sie nicht in den Ausschnitt ragt.
			await page.addStyleTag({
				content: 'header, [data-sticky], .sticky { visibility: hidden !important; }'
			});
			await page.waitForTimeout(1500);
			const box = await map.boundingBox();
			if (!box) throw new Error('Wahlkarte nicht gefunden');
			// 6:5 aus der Mitte der Kartenbox.
			const width = Math.min(box.width, (box.height * 6) / 5);
			const height = (width * 5) / 6;
			return {
				x: box.x + (box.width - width) / 2,
				y: box.y + (box.height - height) / 2,
				width,
				height
			};
		}
	}
];

async function main(): Promise<void> {
	await mkdir(OUT, { recursive: true });
	const browser = await chromium.launch({ executablePath: CHROME, headless: false });
	try {
		for (const locale of HOME_PREVIEW_LOCALES) {
			const prefix = locale === 'de' ? '' : `/${locale}`;
			await mkdir(join(OUT, locale), { recursive: true });
			for (const shot of SHOTS) {
				const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
				await page.goto(BASE + prefix + shot.path, { waitUntil: 'networkidle' });
				await page.waitForTimeout(SETTLE_MS);
				if ((await page.getByText('Karte konnte nicht geladen werden').count()) > 0) {
					throw new Error(`${shot.name}: Karte nicht geladen (WebGL?)`);
				}
				await shot.prepare?.(page);
				await page.waitForTimeout(1500);
				const clip = await (shot.clip ?? fullMap)(page);
				if (shot.width && Math.abs(clip.width / clip.height - 6 / 5) > 0.01) {
					throw new Error(`${shot.name}: Clip ist nicht 6:5 (${clip.width}x${clip.height})`);
				}
				const png = await page.screenshot({ clip });
				const file = join(OUT, locale, `${shot.name}.webp`);
				await sharp(png)
					.resize(
						shot.width
							? { width: shot.width, height: Math.round((shot.width * 5) / 6), fit: 'fill' }
							: { width: 1600, withoutEnlargement: true }
					)
					.webp({ quality: 82 })
					.toFile(file);
				console.log(`${shot.name} -> static/home/${locale}/${shot.name}.webp`);
				await page.close();
			}
		}
	} finally {
		await browser.close();
	}
}

await main();
