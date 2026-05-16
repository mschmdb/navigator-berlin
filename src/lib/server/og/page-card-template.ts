/**
 * Satori-VDOM-Templates für Bezirks-, Kiez- und Layer-OG-Karten (Story 2.6,
 * Score-Card-Pivot 2026-05-16: Bezirk + Kiez tragen jetzt Kiez-Score-Composite
 * + 4 Dimensionen statt Top-3-Aggregate; Soziale-Lage off-card per Stigma-
 * Schutz). Layer-Card behält Quelle/Lizenz/Stand-Layout aus Story 2.6.
 *
 * Layout (Bezirk/Kiez):
 *   - 1200×630 Root mit Brand-Color-Background.
 *   - 720 px Panel-Card linksbündig mit:
 *     Logo + Brand-Mark · Headline (Plex-Serif) · Sub-Line · Composite-Hero
 *     · 4 Dim-Mini · Footer (URL + Stand).
 *
 * Font-Loading via `loadDefaultOgFonts` aus Story 1.20 (Memory
 * `project_satori_font_pipeline`: kein woff2 direkt, kein Variable-Font,
 * sequenzielles wawoff2). Pure-VDOM, IO im Aufrufer.
 *
 * Tests in `./page-card-template.test.ts`.
 */

import type { ScoreCardData } from './score-card-data.js';
import { formatScoreValue } from './score-card-data.js';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLOR_BG = '#ECEAE0';
const COLOR_PANEL = 'rgba(236, 234, 224, 0.92)';
const COLOR_INK = '#141414';
const COLOR_INK_MUTED = '#4A4A46';
const COLOR_INK_SUBTLE = '#5F5F5A';
const COLOR_RULE = '#C8C6BB';
const COLOR_ACCENT = '#2A3F7C';

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

function brandMark(logoDataUri: string | undefined): SatoriNode {
	const children: SatoriNode[] = [];
	if (logoDataUri) {
		children.push(img(logoDataUri, { width: 32, height: 32, display: 'flex' }));
	}
	children.push(
		text('navigator.berlin', {
			fontFamily: 'Plex Mono',
			fontSize: 22,
			color: COLOR_ACCENT,
			fontWeight: 600,
			letterSpacing: 0.5,
			textTransform: 'uppercase' as const
		})
	);
	return node(
		'div',
		{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 },
		children
	);
}

function compositeHero(composite: number | null): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'flex-end',
			gap: 14,
			paddingTop: 12
		},
		[
			text(formatScoreValue(composite), {
				fontFamily: 'Plex Serif',
				fontSize: 96,
				color: COLOR_INK,
				lineHeight: 1
			}),
			text('/ 100', {
				fontFamily: 'Plex Mono',
				fontSize: 28,
				color: COLOR_INK_SUBTLE,
				paddingBottom: 12
			}),
			text('Kiez-Score', {
				fontFamily: 'Plex Sans',
				fontSize: 20,
				color: COLOR_INK_MUTED,
				textTransform: 'uppercase' as const,
				letterSpacing: 0.5,
				paddingBottom: 18,
				marginLeft: 12
			})
		]
	);
}

function dimCell(label: string, value: number | null): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'column',
			gap: 4,
			minWidth: 0,
			flex: 1
		},
		[
			text(label, {
				fontFamily: 'Plex Sans',
				fontSize: 16,
				color: COLOR_INK_SUBTLE,
				textTransform: 'uppercase' as const,
				letterSpacing: 0.4
			}),
			text(formatScoreValue(value), {
				fontFamily: 'Plex Mono',
				fontSize: 28,
				color: COLOR_INK,
				lineHeight: 1.2
			})
		]
	);
}

function dimsRow(scoreCard: ScoreCardData): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			gap: 24,
			width: '100%',
			paddingTop: 20,
			borderTop: `2px solid ${COLOR_RULE}`
		},
		scoreCard.dims.map((d) => dimCell(d.label, d.value))
	);
}

function footer(urlPath: string, standDate: string | null): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingTop: 20,
			borderTop: `1px solid ${COLOR_RULE}`,
			width: '100%'
		},
		[
			text(urlPath, {
				fontFamily: 'Plex Mono',
				fontSize: 18,
				color: COLOR_ACCENT
			}),
			text(standDate ? `Stand ${standDate}` : 'Stand: navigator.berlin', {
				fontFamily: 'Plex Mono',
				fontSize: 16,
				color: COLOR_INK_SUBTLE
			})
		]
	);
}

interface PanelInput {
	readonly headline: string;
	readonly subline: string;
	readonly mid?: SatoriNode;
	readonly footerUrl: string;
	readonly footerDate: string | null;
	readonly logoDataUri?: string;
}

function panel(input: PanelInput): SatoriNode {
	const children: SatoriNode[] = [
		brandMark(input.logoDataUri),
		text(input.headline, {
			fontFamily: 'Plex Serif',
			fontSize: 64,
			color: COLOR_INK,
			lineHeight: 1.1,
			marginTop: 8,
			maxWidth: 600
		}),
		text(input.subline, {
			fontFamily: 'Plex Sans',
			fontSize: 26,
			color: COLOR_INK_MUTED,
			marginTop: 4
		})
	];
	if (input.mid) children.push(input.mid);
	children.push(footer(input.footerUrl, input.footerDate));

	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			width: 720,
			height: OG_HEIGHT,
			padding: 56,
			backgroundColor: COLOR_PANEL,
			fontFamily: 'Plex Sans',
			color: COLOR_INK
		},
		children
	);
}

function root(panelNode: SatoriNode): SatoriNode {
	return node(
		'div',
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			display: 'flex',
			flexDirection: 'row',
			backgroundColor: COLOR_BG
		},
		[panelNode]
	);
}

function scoreMid(scoreCard: ScoreCardData): SatoriNode {
	return node(
		'div',
		{ display: 'flex', flexDirection: 'column', gap: 16 },
		[compositeHero(scoreCard.composite), dimsRow(scoreCard)]
	);
}

export interface BezirkCardParams {
	readonly bezirkName: string;
	readonly slug: string;
	readonly scoreCard: ScoreCardData;
	readonly scoreUpdatedAt?: string | null;
	readonly logoDataUri?: string;
}

export function buildBezirkCardVdom(params: BezirkCardParams): SatoriNode {
	const panelNode = panel({
		headline: params.bezirkName,
		subline: 'Bezirk Berlin',
		mid: scoreMid(params.scoreCard),
		footerUrl: `/bezirk/${params.slug}`,
		footerDate: params.scoreUpdatedAt ?? null,
		logoDataUri: params.logoDataUri
	});
	return root(panelNode);
}

export interface KiezCardParams {
	readonly kiezName: string;
	readonly slug: string;
	readonly parentBezirkName: string;
	readonly scoreCard: ScoreCardData;
	readonly scoreUpdatedAt?: string | null;
	readonly logoDataUri?: string;
}

export function buildKiezCardVdom(params: KiezCardParams): SatoriNode {
	const panelNode = panel({
		headline: params.kiezName,
		subline: `Kiez · ${params.parentBezirkName}`,
		mid: scoreMid(params.scoreCard),
		footerUrl: `/kiez/${params.slug}`,
		footerDate: params.scoreUpdatedAt ?? null,
		logoDataUri: params.logoDataUri
	});
	return root(panelNode);
}

export interface LayerCardParams {
	readonly layerSlug: string;
	readonly layerLabel: string;
	readonly bundleGroup: string;
	readonly authority: string;
	readonly license: string;
	readonly sourceUpdatedAt: string;
	readonly logoDataUri?: string;
}

function layerInfoRow(params: LayerCardParams): SatoriNode {
	const cell = (label: string, value: string): SatoriNode =>
		node(
			'div',
			{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 },
			[
				text(label, {
					fontFamily: 'Plex Sans',
					fontSize: 16,
					color: COLOR_INK_SUBTLE,
					textTransform: 'uppercase' as const,
					letterSpacing: 0.4
				}),
				text(value, {
					fontFamily: 'Plex Mono',
					fontSize: 20,
					color: COLOR_INK,
					lineHeight: 1.25,
					maxWidth: 280
				})
			]
		);
	const standValue = params.sourceUpdatedAt && params.sourceUpdatedAt.length > 0
		? params.sourceUpdatedAt
		: '–';
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			gap: 24,
			width: '100%',
			paddingTop: 24,
			borderTop: `2px solid ${COLOR_RULE}`
		},
		[
			cell('Quelle', params.authority),
			cell('Lizenz', params.license),
			cell('Stand', standValue)
		]
	);
}

export function buildLayerCardVdom(params: LayerCardParams): SatoriNode {
	const footerDate = params.sourceUpdatedAt && params.sourceUpdatedAt.length > 0
		? params.sourceUpdatedAt
		: null;
	const panelNode = panel({
		headline: params.layerLabel,
		subline: params.bundleGroup,
		mid: layerInfoRow(params),
		footerUrl: `/layer/${params.layerSlug}`,
		footerDate,
		logoDataUri: params.logoDataUri
	});
	return root(panelNode);
}
