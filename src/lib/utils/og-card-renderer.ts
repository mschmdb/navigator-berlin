import { isInBerlin } from '$lib/data/constants.js';

export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;

const MAX_ADDRESS_LENGTH = 200;
const MAX_TOP_LAYERS = 3;
const MAX_LAYER_LABEL_LENGTH = 80;

export interface OgParams {
	readonly address: string;
	readonly lat: number;
	readonly lng: number;
	readonly bezirk?: string;
	readonly topLayers: readonly string[];
	readonly generatedDate: string;
}

export type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function trimTo(value: string, max: number): string {
	if (value.length <= max) return value;
	return value.slice(0, max);
}

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export function validateOgParams(query: URLSearchParams): ValidateResult<OgParams> {
	const rawAddress = query.get('address');
	if (!rawAddress) return { ok: false, error: 'Parameter "address" fehlt.' };

	const latStr = query.get('lat');
	const lngStr = query.get('lng');
	if (!latStr || !lngStr) return { ok: false, error: 'Parameter "lat" oder "lng" fehlt.' };

	const lat = Number.parseFloat(latStr);
	const lng = Number.parseFloat(lngStr);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return { ok: false, error: 'Parameter "lat"/"lng" sind keine gültigen Zahlen.' };
	}
	if (!isInBerlin(lat, lng)) {
		return { ok: false, error: 'Koordinate liegt außerhalb der Berlin-BBox.' };
	}

	const address = trimTo(rawAddress, MAX_ADDRESS_LENGTH);
	const bezirkRaw = query.get('bezirk');
	const bezirk = bezirkRaw ? trimTo(bezirkRaw, MAX_ADDRESS_LENGTH) : undefined;
	const topLayersRaw = query.get('topLayers') ?? '';
	const topLayers = topLayersRaw
		.split('|')
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.slice(0, MAX_TOP_LAYERS)
		.map((s) => trimTo(s, MAX_LAYER_LABEL_LENGTH));

	const generatedDate = trimTo(query.get('date') ?? todayIsoDate(), 10);

	return {
		ok: true,
		data: { address, lat, lng, bezirk, topLayers, generatedDate }
	};
}

export interface SatoriNode {
	type: string;
	props: {
		style?: Record<string, unknown>;
		children?: SatoriNode | SatoriNode[] | string | undefined;
	} & Record<string, unknown>;
}

const COLOR_BG = '#ECEAE0';
const COLOR_INK = '#141414';
const COLOR_INK_MUTED = '#4A4A46';
const COLOR_INK_SUBTLE = '#5F5F5A';
const COLOR_RULE = '#C8C6BB';
const COLOR_ACCENT = '#2A3F7C';

function node(type: string, style: Record<string, unknown>, children?: SatoriNode['props']['children']): SatoriNode {
	return { type, props: { style, children } };
}

function text(value: string, style: Record<string, unknown>): SatoriNode {
	return node('div', style, value);
}

function buildHeader(params: OgParams): SatoriNode {
	const lines: SatoriNode[] = [
		text(params.address, {
			fontFamily: 'Plex Serif',
			fontSize: 64,
			color: COLOR_INK,
			lineHeight: 1.1,
			maxWidth: 920
		})
	];
	if (params.bezirk) {
		lines.push(
			text(params.bezirk, {
				fontFamily: 'Plex Sans',
				fontSize: 28,
				color: COLOR_INK_MUTED,
				marginTop: 8
			})
		);
	}
	return node(
		'div',
		{ display: 'flex', flexDirection: 'column', gap: 4 },
		lines
	);
}

function buildLayerList(params: OgParams): SatoriNode {
	if (params.topLayers.length === 0) {
		return text('Atlas-Snapshot zur Adresse', {
			fontFamily: 'Plex Sans',
			fontSize: 24,
			color: COLOR_INK_MUTED
		});
	}
	const items = params.topLayers.map((label) =>
		text(label, {
			fontFamily: 'Plex Mono',
			fontSize: 30,
			color: COLOR_INK,
			lineHeight: 1.3
		})
	);
	return node(
		'div',
		{ display: 'flex', flexDirection: 'column', gap: 12 },
		items
	);
}

function buildFooter(params: OgParams): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingTop: 24,
			borderTop: `2px solid ${COLOR_RULE}`,
			width: '100%'
		},
		[
			text('navigator.berlin', {
				fontFamily: 'Plex Sans',
				fontSize: 24,
				color: COLOR_ACCENT,
				fontWeight: 600
			}),
			text(`Stand ${params.generatedDate}`, {
				fontFamily: 'Plex Mono',
				fontSize: 20,
				color: COLOR_INK_SUBTLE
			})
		]
	);
}

export function buildOgCardVdom(params: OgParams): SatoriNode {
	return node(
		'div',
		{
			width: OG_CARD_WIDTH,
			height: OG_CARD_HEIGHT,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: 64,
			backgroundColor: COLOR_BG,
			fontFamily: 'Plex Sans',
			color: COLOR_INK
		},
		[
			buildHeader(params),
			node('div', { display: 'flex', flexDirection: 'column', gap: 16 }, [buildLayerList(params)]),
			buildFooter(params)
		]
	);
}

export interface OgFont {
	name: 'Plex Sans' | 'Plex Serif' | 'Plex Mono';
	data: Buffer | ArrayBuffer;
	weight: 400 | 600;
	style: 'normal';
}

export interface RenderOgCardOpts {
	fonts: readonly OgFont[];
}

export async function renderOgCardPng(
	params: OgParams,
	opts: RenderOgCardOpts
): Promise<Buffer> {
	const { default: satori } = await import('satori');
	const { Resvg } = await import('@resvg/resvg-js');

	const vdom = buildOgCardVdom(params);
	const svg = await satori(vdom as unknown as Parameters<typeof satori>[0], {
		width: OG_CARD_WIDTH,
		height: OG_CARD_HEIGHT,
		fonts: opts.fonts.map((f) => ({
			name: f.name,
			data: f.data,
			weight: f.weight,
			style: f.style
		}))
	});
	const resvg = new Resvg(svg);
	return Buffer.from(resvg.render().asPng());
}

let cachedFonts: OgFont[] | null = null;

async function woff2ToTtf(woff2: Buffer): Promise<Buffer> {
	const wawoff2 = await import('wawoff2');
	const decompressed = await wawoff2.decompress(woff2);
	return Buffer.from(decompressed);
}

const FONTSOURCE_FILES = {
	sans400: '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
	sans600: '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
	serif400: '@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff2',
	mono400: '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'
} as const;

async function loadFontsourceWoff2(pkg: string): Promise<Buffer> {
	const { readFile } = await import('node:fs/promises');
	const { createRequire } = await import('node:module');
	const require = createRequire(import.meta.url);
	const filePath = require.resolve(pkg);
	return readFile(filePath);
}

export async function loadDefaultOgFonts(_staticDir?: string): Promise<OgFont[]> {
	void _staticDir;
	if (cachedFonts) return cachedFonts;
	const [sansRaw, sansBoldRaw, serifRaw, monoRaw] = await Promise.all([
		loadFontsourceWoff2(FONTSOURCE_FILES.sans400),
		loadFontsourceWoff2(FONTSOURCE_FILES.sans600),
		loadFontsourceWoff2(FONTSOURCE_FILES.serif400),
		loadFontsourceWoff2(FONTSOURCE_FILES.mono400)
	]);
	// wawoff2 uses shared WASM memory state. Sequential decompression avoids cross-call corruption.
	const sans = await woff2ToTtf(sansRaw);
	const sansBold = await woff2ToTtf(sansBoldRaw);
	const serif = await woff2ToTtf(serifRaw);
	const mono = await woff2ToTtf(monoRaw);
	cachedFonts = [
		{ name: 'Plex Sans', data: sans, weight: 400, style: 'normal' },
		{ name: 'Plex Sans', data: sansBold, weight: 600, style: 'normal' },
		{ name: 'Plex Serif', data: serif, weight: 400, style: 'normal' },
		{ name: 'Plex Mono', data: mono, weight: 400, style: 'normal' }
	];
	return cachedFonts;
}

export function _resetOgFontCacheForTest(): void {
	cachedFonts = null;
}
