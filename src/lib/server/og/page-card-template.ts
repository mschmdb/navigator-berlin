/**
 * Satori-VDOM-Templates für Bezirks-, Kiez- und Layer-OG-Karten (Story 2.6).
 *
 * Layout-Pattern (alle drei Varianten):
 *   - 1200×630 Root mit Karten-Snapshot als `backgroundImage` (vom Caller als
 *     data-URI bereitgestellt; Pure-Function bleibt IO-frei).
 *   - Linker Spalten-Block 720 px breit, halbtransparente Panel-Card mit:
 *     Brand-Mark oben, Headline (Plex-Serif), Sub-Line (Plex-Sans),
 *     Stat-/Info-Reihe (Plex-Mono), Footer (URL + Stand).
 *
 * Re-use bestehender Brand-Tokens aus `src/lib/utils/og-card-renderer.ts`
 * (Story 1.20). Schriftarten kommen via `loadDefaultOgFonts` (Plex Sans/Serif/Mono),
 * Memory `project_satori_font_pipeline.md` (kein woff2 direkt, kein Variable-Font,
 * sequenzielles wawoff2). Diese Datei ist Pure-VDOM, Font-Loading liegt im Aufrufer.
 *
 * Pure-Function-Tests in `./page-card-template.test.ts` validieren Text-Nodes
 * pro Layout-Variante.
 */

import type { Top3StatCard } from './top-stats-selector.js';

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

function brandMark(): SatoriNode {
	return text('navigator.berlin', {
		fontFamily: 'Plex Mono',
		fontSize: 22,
		color: COLOR_ACCENT,
		fontWeight: 600,
		letterSpacing: 0.5,
		textTransform: 'uppercase' as const
	});
}

function statRow(stat: Top3StatCard): SatoriNode {
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
			text(stat.label, {
				fontFamily: 'Plex Sans',
				fontSize: 18,
				color: COLOR_INK_SUBTLE,
				textTransform: 'uppercase' as const,
				letterSpacing: 0.4
			}),
			text(stat.value, {
				fontFamily: 'Plex Mono',
				fontSize: 30,
				color: COLOR_INK,
				lineHeight: 1.2
			})
		]
	);
}

function statsRow(stats: readonly Top3StatCard[]): SatoriNode {
	return node(
		'div',
		{
			display: 'flex',
			flexDirection: 'row',
			gap: 28,
			width: '100%',
			paddingTop: 24,
			borderTop: `2px solid ${COLOR_RULE}`
		},
		stats.map(statRow)
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
}

function panel(input: PanelInput): SatoriNode {
	const children: SatoriNode[] = [
		brandMark(),
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

function root(panelNode: SatoriNode, mapSnapshotDataUri: string | null): SatoriNode {
	const style: Record<string, unknown> = {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		display: 'flex',
		flexDirection: 'row',
		backgroundColor: COLOR_BG
	};
	if (mapSnapshotDataUri) {
		style.backgroundImage = `url(${mapSnapshotDataUri})`;
		style.backgroundSize = `${OG_WIDTH}px ${OG_HEIGHT}px`;
		style.backgroundRepeat = 'no-repeat';
		style.backgroundPosition = 'center';
	}
	return node('div', style, [panelNode]);
}

export interface BezirkCardParams {
	readonly bezirkName: string;
	readonly slug: string;
	readonly topStats: readonly Top3StatCard[];
	readonly mapSnapshotDataUri?: string;
}

export function buildBezirkCardVdom(params: BezirkCardParams): SatoriNode {
	const newestStand =
		params.topStats
			.map((s) => s.sourceUpdatedAt)
			.filter((d): d is string => typeof d === 'string')
			.sort()
			.at(-1) ?? null;
	const panelNode = panel({
		headline: params.bezirkName,
		subline: 'Bezirk Berlin',
		mid: statsRow(params.topStats),
		footerUrl: `/bezirk/${params.slug}`,
		footerDate: newestStand
	});
	return root(panelNode, params.mapSnapshotDataUri ?? null);
}

export interface KiezCardParams {
	readonly kiezName: string;
	readonly slug: string;
	readonly parentBezirkName: string;
	readonly topStats: readonly Top3StatCard[];
	readonly mapSnapshotDataUri?: string;
}

export function buildKiezCardVdom(params: KiezCardParams): SatoriNode {
	const newestStand =
		params.topStats
			.map((s) => s.sourceUpdatedAt)
			.filter((d): d is string => typeof d === 'string')
			.sort()
			.at(-1) ?? null;
	const panelNode = panel({
		headline: params.kiezName,
		subline: `Kiez · ${params.parentBezirkName}`,
		mid: statsRow(params.topStats),
		footerUrl: `/kiez/${params.slug}`,
		footerDate: newestStand
	});
	return root(panelNode, params.mapSnapshotDataUri ?? null);
}

export interface LayerCardParams {
	readonly layerSlug: string;
	readonly layerLabel: string;
	readonly bundleGroup: string;
	readonly authority: string;
	readonly license: string;
	readonly sourceUpdatedAt: string;
	readonly mapSnapshotDataUri?: string;
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
		footerDate
	});
	return root(panelNode, params.mapSnapshotDataUri ?? null);
}
