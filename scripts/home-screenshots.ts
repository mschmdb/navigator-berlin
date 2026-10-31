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
	/** Ausschnitt; Default: Karte und Panel ohne Kopf- und Fußzeile. */
	readonly clip?: (page: Page) => Promise<{ x: number; y: number; width: number; height: number }>;
}

const fullMap = async () => ({
	x: 0,
	y: HEADER,
	width: VIEWPORT.width,
	height: VIEWPORT.height - HEADER - FOOTER
});

const SHOTS: readonly Shot[] = [
	{
		name: 'hitze',
		path: '/explore?layers=klima-pet-2022&address=13.4243,52.4869&q=Hermannplatz'
	},
	{
		name: 'kiez-score',
		path: '/explore?layers=kiez-score-ruhe-luft,kiez-score-wohnschutz&address=13.3735,52.5186&q=Regierungsviertel',
		prepare: async (page) => {
			// Ganz Berlin zeigen: nach dem Sprung zur Adresse herauszoomen.
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
		path: '/explore?finder=1',
		prepare: async (page) => {
			const sliders = page.getByRole('slider');
			// Ruhe & Luft und Grün & Hitzeschutz auf „möglichst viel“.
			for (const i of [0, 1]) {
				await sliders.nth(i).focus();
				for (let k = 0; k < 10; k++) await page.keyboard.press('ArrowRight');
			}
			// Fokusrahmen nicht mit aufnehmen.
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
		}
	},
	{
		name: 'wahlen',
		path: '/berlin-wahlen?jahr=2026',
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
			return box;
		}
	}
];

async function main(): Promise<void> {
	await mkdir(OUT, { recursive: true });
	const browser = await chromium.launch({ executablePath: CHROME, headless: false });
	try {
		for (const shot of SHOTS) {
			const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
			await page.goto(BASE + shot.path, { waitUntil: 'networkidle' });
			await page.waitForTimeout(SETTLE_MS);
			if ((await page.getByText('Karte konnte nicht geladen werden').count()) > 0) {
				throw new Error(`${shot.name}: Karte nicht geladen (WebGL?)`);
			}
			await shot.prepare?.(page);
			await page.waitForTimeout(1500);
			const clip = await (shot.clip ?? fullMap)(page);
			const png = await page.screenshot({ clip });
			const file = join(OUT, `${shot.name}.webp`);
			await sharp(png)
				.resize({ width: 1600, withoutEnlargement: true })
				.webp({ quality: 82 })
				.toFile(file);
			console.log(`${shot.name} -> static/home/${shot.name}.webp`);
			await page.close();
		}
	} finally {
		await browser.close();
	}
}

await main();
