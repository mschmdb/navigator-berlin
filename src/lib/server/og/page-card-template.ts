/**
 * Satori-VDOM-Templates für OG-Cards: Bezirk/Kiez (Score-Hero + Dim-Bars),
 * Layer (Quelle/Lizenz/Stand), Page (Hero-Typo + Body).
 *
 * Render-Resolution = 1200×630 (OG-Spec). Supersample-then-Downsample passiert
 * in `render-page-card.ts` (Satori bei 1200×630 → resvg zoom 2 → sharp lanczos3
 * downsample → 1200×630 PNG). Direkt-2×-Auslieferung war blurry weil
 * LinkedIn/Twitter aggressiv re-encoden (Vercel-Issue #60813).
 *
 * Layout-Grundprinzip (2026-05-17 Redesign):
 *   - Hero-Typografie füllt links ~60 % der Breite
 *   - Right-Half: Data-Viz (dim-bars) oder Watermark (Berlin-Outline)
 *   - Accent-Footer-Strip ankert die Komposition
 *   - 70 % Whitespace = vermeiden
 *
 * Font-Loading via Story-1.20-Pipeline (Memory `project_satori_font_pipeline`).
 * Pure-VDOM, IO im Aufrufer.
 *
 * Tests in `./page-card-template.test.ts`.
 */

import type { ScoreCardData } from './score-card-data.js';
import { formatScoreValue } from './score-card-data.js';

// OG-Spec-Dimensions. Supersample im Render-Layer, hier 1× authoring.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLOR_BG = '#ECEAE0';
const COLOR_INK = '#141414';
const COLOR_INK_MUTED = '#4A4A46';
const COLOR_INK_SUBTLE = '#5F5F5A';
const COLOR_RULE = '#C8C6BB';
const COLOR_ACCENT = '#2A3F7C';
const COLOR_ACCENT_SOFT = '#D8D5C7';

const PAD_X = 56;
const PAD_Y = 44;
const FOOTER_HEIGHT = 56;

export interface SatoriNode {
	type: string;
	props: {
		style?: Record<string, unknown>;
		children?: SatoriNode | SatoriNode[] | string | undefined;
	} & Record<string, unknown>;
}

function node(
	type: string,
	style: Record<string, unknown>,
	children?: SatoriNode['props']['children']
): SatoriNode {
	return { type, props: { style, children } };
}

function text(value: string, style: Record<string, unknown>): SatoriNode {
	return node('div', style, value);
}

function img(src: string, style: Record<string, unknown>): SatoriNode {
	return { type: 'img', props: { src, style } };
}

function brandMark(): SatoriNode {
	return text('navigator.berlin', {
		fontFamily: 'Plex Mono',
		fontSize: 14,
		color: COLOR_ACCENT,
		fontWeight: 600,
		letterSpacing: 0.6,
		textTransform: 'uppercase' as const
	});
}

function watermark(dataUri: string, opacity: number): SatoriNode {
	return img(dataUri, {
		position: 'absolute',
		right: -90,
		top: 60,
		width: 540,
		height: 540,
		opacity
	});
}

function headerBrand(logoDataUri: string | undefined): SatoriNode {
	const children: SatoriNode[] = [brandMark()];
	if (logoDataUri) {
		children.push(
			img(logoDataUri, {
				width: 64,
				height: 48,
				display: 'flex',
				marginLeft: 'auto'
			})
		);
	}
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			width: '100%'
		},
		children
	);
}

function titleBlock(headline: string, subline: string, maxWidth: number): SatoriNode {
	return node(
		'div',
		{ display: 'flex', flexDirection: 'column', marginTop: 16 },
		[
			text(headline, {
				fontFamily: 'Plex Serif',
				fontSize: 64,
				color: COLOR_INK,
				lineHeight: 1.02,
				maxWidth,
				fontWeight: 600
			}),
			text(subline, {
				fontFamily: 'Plex Sans',
				fontSize: 18,
				color: COLOR_INK_MUTED,
				marginTop: 8,
				textTransform: 'uppercase' as const,
				letterSpacing: 1
			})
		]
	);
}

function footerStrip(urlPath: string, standDate: string | null): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			width: '100%',
			height: FOOTER_HEIGHT,
			paddingLeft: PAD_X,
			paddingRight: PAD_X,
			backgroundColor: COLOR_ACCENT
		},
		[
			text(urlPath || '/', {
				fontFamily: 'Plex Mono',
				fontSize: 16,
				color: '#FFFFFF',
				fontWeight: 500
			}),
			text(standDate ? `Stand ${standDate}` : 'navigator.berlin', {
				fontFamily: 'Plex Mono',
				fontSize: 14,
				color: '#E8E5D8',
				letterSpacing: 0.4
			})
		]
	);
}

function compositeHero(composite: number | null): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start'
		},
		[
			node(
				'div',
				{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'baseline',
					gap: 8
				},
				[
					text(formatScoreValue(composite), {
						fontFamily: 'Plex Serif',
						fontSize: 180,
						color: COLOR_INK,
						lineHeight: 0.9,
						fontWeight: 600
					}),
					text('/ 100', {
						fontFamily: 'Plex Mono',
						fontSize: 28,
						color: COLOR_INK_SUBTLE,
						fontWeight: 500
					})
				]
			),
			text('Kiez-Score', {
				fontFamily: 'Plex Sans',
				fontSize: 16,
				color: COLOR_ACCENT,
				textTransform: 'uppercase' as const,
				letterSpacing: 2,
				marginTop: 4,
				fontWeight: 600
			})
		]
	);
}

function dimBar(label: string, value: number | null): SatoriNode {
	const pct = typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.min(100, value))
		: 0;
	const valueLabel = formatScoreValue(value);
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: 14,
			width: '100%'
		},
		[
			text(label, {
				fontFamily: 'Plex Sans',
				fontSize: 14,
				color: COLOR_INK_SUBTLE,
				textTransform: 'uppercase' as const,
				letterSpacing: 1,
				width: 110,
				fontWeight: 600
			}),
			node(
				'div',
				{
					display: 'flex',
					flex: 1,
					height: 10,
					backgroundColor: COLOR_ACCENT_SOFT,
					borderRadius: 5
				},
				[
					node(
						'div',
						{
							display: 'flex',
							width: `${pct}%`,
							height: 10,
							backgroundColor: COLOR_ACCENT,
							borderRadius: 5
						},
						[]
					)
				]
			),
			text(valueLabel, {
				fontFamily: 'Plex Mono',
				fontSize: 22,
				color: COLOR_INK,
				width: 48,
				textAlign: 'right' as const,
				fontWeight: 500
			})
		]
	);
}

function dimBarStack(scoreCard: ScoreCardData): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'column',
			gap: 16,
			width: '100%'
		},
		scoreCard.dims.map((d) => dimBar(d.label, d.value))
	);
}

function scoreSplitRow(scoreCard: ScoreCardData): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: 48,
			width: '100%',
			marginTop: 12
		},
		[
			node(
				'div',
				{ display: 'flex', width: 340, flexShrink: 0 },
				compositeHero(scoreCard.composite)
			),
			node(
				'div',
				{ display: 'flex', flex: 1, flexDirection: 'column' },
				dimBarStack(scoreCard)
			)
		]
	);
}

interface CanvasOptions {
	readonly mid: SatoriNode;
	readonly headline: string;
	readonly subline: string;
	readonly footerUrl: string;
	readonly footerDate: string | null;
	readonly logoDataUri?: string;
	readonly watermarkDataUri?: string;
	readonly watermarkOpacity?: number;
	readonly headlineMaxWidth?: number;
}

function canvas(opts: CanvasOptions): SatoriNode {
	const contentChildren: SatoriNode[] = [
		headerBrand(opts.logoDataUri),
		titleBlock(opts.headline, opts.subline, opts.headlineMaxWidth ?? 1000),
		node('div', { display: 'flex', flex: 1, width: '100%', marginTop: 24 }, opts.mid)
	];

	const layers: SatoriNode[] = [];
	if (opts.watermarkDataUri) {
		layers.push(watermark(opts.watermarkDataUri, opts.watermarkOpacity ?? 0.12));
	}
	layers.push(
		node(
			'div',
			{
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				flex: 1,
				paddingLeft: PAD_X,
				paddingRight: PAD_X,
				paddingTop: PAD_Y,
				paddingBottom: PAD_Y,
				fontFamily: 'Plex Sans',
				color: COLOR_INK
			},
			contentChildren
		)
	);
	layers.push(footerStrip(opts.footerUrl, opts.footerDate));

	return node(
		'div',
		{
			position: 'relative',
			width: OG_WIDTH,
			height: OG_HEIGHT,
			display: 'flex',
			flexDirection: 'column',
			backgroundColor: COLOR_BG,
			overflow: 'hidden'
		},
		layers
	);
}

export interface BezirkCardParams {
	readonly bezirkName: string;
	readonly slug: string;
	readonly scoreCard: ScoreCardData;
	readonly scoreUpdatedAt?: string | null;
	readonly logoDataUri?: string;
	readonly watermarkDataUri?: string;
}

export function buildBezirkCardVdom(params: BezirkCardParams): SatoriNode {
	return canvas({
		headline: params.bezirkName,
		subline: 'Bezirk Berlin · Kiez-Score',
		mid: scoreSplitRow(params.scoreCard),
		footerUrl: `/bezirk/${params.slug}`,
		footerDate: params.scoreUpdatedAt ?? null,
		logoDataUri: params.logoDataUri,
		watermarkDataUri: params.watermarkDataUri,
		watermarkOpacity: 0.08
	});
}

export interface KiezCardParams {
	readonly kiezName: string;
	readonly slug: string;
	readonly parentBezirkName: string;
	readonly scoreCard: ScoreCardData;
	readonly scoreUpdatedAt?: string | null;
	readonly logoDataUri?: string;
	readonly watermarkDataUri?: string;
}

export function buildKiezCardVdom(params: KiezCardParams): SatoriNode {
	return canvas({
		headline: params.kiezName,
		subline: `Kiez · ${params.parentBezirkName}`,
		mid: scoreSplitRow(params.scoreCard),
		footerUrl: `/kiez/${params.slug}`,
		footerDate: params.scoreUpdatedAt ?? null,
		logoDataUri: params.logoDataUri,
		watermarkDataUri: params.watermarkDataUri,
		watermarkOpacity: 0.08,
		headlineMaxWidth: 900
	});
}

export interface LayerCardParams {
	readonly layerSlug: string;
	readonly layerLabel: string;
	readonly bundleGroup: string;
	readonly authority: string;
	readonly license: string;
	readonly sourceUpdatedAt: string;
	readonly logoDataUri?: string;
	readonly watermarkDataUri?: string;
}

function layerInfoCell(label: string, value: string): SatoriNode {
	return node(
		'div',
		{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 },
		[
			text(label, {
				fontFamily: 'Plex Sans',
				fontSize: 12,
				color: COLOR_INK_SUBTLE,
				textTransform: 'uppercase' as const,
				letterSpacing: 1.2,
				fontWeight: 600
			}),
			text(value, {
				fontFamily: 'Plex Mono',
				fontSize: 18,
				color: COLOR_INK,
				lineHeight: 1.3,
				maxWidth: 280
			})
		]
	);
}

function layerInfoRow(params: LayerCardParams): SatoriNode {
	const standValue = params.sourceUpdatedAt && params.sourceUpdatedAt.length > 0
		? params.sourceUpdatedAt
		: '–';
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			gap: 32,
			width: '100%',
			paddingTop: 20,
			marginTop: 'auto',
			borderTop: `2px solid ${COLOR_RULE}`
		},
		[
			layerInfoCell('Quelle', params.authority),
			layerInfoCell('Lizenz', params.license),
			layerInfoCell('Stand', standValue)
		]
	);
}

export function buildLayerCardVdom(params: LayerCardParams): SatoriNode {
	const footerDate = params.sourceUpdatedAt && params.sourceUpdatedAt.length > 0
		? params.sourceUpdatedAt
		: null;
	return canvas({
		headline: params.layerLabel,
		subline: params.bundleGroup,
		mid: layerInfoRow(params),
		footerUrl: `/layer/${params.layerSlug}`,
		footerDate,
		logoDataUri: params.logoDataUri,
		watermarkDataUri: params.watermarkDataUri,
		watermarkOpacity: 0.06,
		headlineMaxWidth: 1000
	});
}

export interface PageCardParams {
	readonly headline: string;
	readonly subline: string;
	readonly body: string;
	readonly footerUrl: string;
	readonly footerDate?: string | null;
	readonly logoDataUri?: string;
	readonly watermarkDataUri?: string;
}

function pageBody(body: string): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'column',
			width: '100%',
			maxWidth: 760
		},
		[
			text(body, {
				fontFamily: 'Plex Serif',
				fontSize: 24,
				color: COLOR_INK,
				lineHeight: 1.45
			})
		]
	);
}

export function buildPageCardVdom(params: PageCardParams): SatoriNode {
	return canvas({
		headline: params.headline,
		subline: params.subline,
		mid: pageBody(params.body),
		footerUrl: params.footerUrl,
		footerDate: params.footerDate ?? null,
		logoDataUri: params.logoDataUri,
		watermarkDataUri: params.watermarkDataUri,
		watermarkOpacity: 0.14,
		headlineMaxWidth: 760
	});
}
