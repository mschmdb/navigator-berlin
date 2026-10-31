<!--
	"Punkt, Linie, Kiez" (#163): Kennzahlen eines Bezirks oder Kiezes als Komposition aus Formen.
	Geometrie und Größen kommen aus `$lib/stories/punkt-linie-kiez`, die Werte nur aus
	`stories-kennzahlen.json`. Jede Form ist fokussierbar und hebt sich mit ihrer Legendenzeile
	hervor. Ohne Bewegung. `decorative` blendet die Figur für Hilfstechnik aus, wenn ein Link
	den Namen trägt.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { geometry } from '$lib/stories/punkt-linie-kiez/geometry.js';
	import {
		legendRows,
		type LegendRow,
		type ShapeKey
	} from '$lib/stories/punkt-linie-kiez/legend.js';
	import { VIEW, type Kennzahlen } from '$lib/stories/punkt-linie-kiez/types.js';
	import { STORY_FONT, STORY_INK, STORY_PAPER, STORY_SERIES } from '$lib/stories/tokens.js';

	interface Props {
		readonly name: string;
		readonly kennzahlen: Kennzahlen;
		/** Kantenlänge in px. Ohne Angabe füllt die Figur ihre Spalte. */
		readonly size?: number;
		/** Miniatur: dieselbe Komposition kleiner. Nur die Strichstärke wächst, damit Linien sichtbar bleiben. */
		readonly thumbnail?: boolean;
		readonly legend?: boolean;
		readonly decorative?: boolean;
		/** Nur das SVG ohne `figure`, etwa innerhalb eines Buttons. Die Zeichnung ist dann dekorativ. */
		readonly bare?: boolean;
	}

	const {
		name,
		kennzahlen,
		size,
		thumbnail = false,
		legend = true,
		decorative: decorativeProp = false,
		bare = false
	}: Props = $props();

	const uid = $props.id();
	const decorative = $derived(decorativeProp || bare);

	const colors = STORY_SERIES['punkt-linie-kiez'].colors;
	const [THIN, THICK] = STORY_SERIES['punkt-linie-kiez'].lineWidths;

	// Miniaturen zeichnen Haarlinien kräftig, sonst verschwinden sie bei kleiner Größe.
	const hair = $derived(thumbnail ? THICK : THIN);
	const geo = $derived(geometry(kennzahlen));
	const rows = $derived(legendRows(kennzahlen));
	const byKey = $derived(new Map<ShapeKey, LegendRow>(rows.map((r) => [r.key, r])));
	const displayName = $derived(name.toLocaleLowerCase('de'));
	const alt = $derived(m.plk_alt({ name }));
	const groupLabel = $derived(`${m.plk_title()}: ${displayName}`);

	const triangleD = (t: { x: number; y: number; size: number }): string =>
		`M${t.x.toFixed(1)},${t.y.toFixed(1)}l${t.size.toFixed(1)},0l${(-t.size / 2).toFixed(1)},${(-t.size * 0.87).toFixed(1)}Z`;

	// Hover und Fokus getrennt: Ein Pointer, der die Form verlässt, löscht den Tastaturfokus nicht.
	let hovered = $state<ShapeKey | null>(null);
	let focused = $state<ShapeKey | null>(null);
	const active = $derived(hovered ?? focused);

	const exists = (key: ShapeKey): boolean =>
		key === 'lines'
			? geo.lines.length > 0
			: key === 'circle'
				? geo.circle !== null
				: key === 'square'
					? geo.square !== null
					: key === 'triangle'
						? geo.triangle !== null
						: key === 'bar'
							? geo.bar !== null
							: geo.donut !== null;

	const label = (key: ShapeKey): string => {
		const r = byKey.get(key)!;
		return `${r.label}, ${r.value}`;
	};
	const outline = (key: ShapeKey): number => (active === key ? THICK : 0);
	const donutR = $derived(geo.donut ? geo.donut.r : 0);

	/** Gemeinsame Attribute einer Form: fokussierbar, Wert als Name, Hervorhebung per `data-*`. */
	function hit(key: ShapeKey) {
		const dim = active !== null && active !== key;
		return {
			'data-testid': `plk-shape-${key}`,
			'data-active': active === key ? 'true' : undefined,
			'data-dimmed': dim ? 'true' : undefined,
			opacity: dim ? 0.3 : 1,
			tabindex: decorative ? undefined : 0,
			role: decorative ? undefined : 'img',
			'aria-label': decorative ? undefined : label(key),
			// Dekorative Zeichnungen sind statisch: weder Fokus noch Hover.
			onfocus: decorative ? undefined : () => (focused = key),
			onblur: decorative ? undefined : () => (focused = null),
			onpointerenter: decorative ? undefined : () => (hovered = key),
			onpointerleave: decorative ? undefined : () => (hovered = null)
		};
	}
</script>

{#snippet board()}
	<svg
		viewBox="0 0 {VIEW} {VIEW}"
		role={decorative ? undefined : 'group'}
		aria-label={decorative ? undefined : groupLabel}
		aria-describedby={decorative ? undefined : `${uid}-desc`}
		aria-hidden={bare ? 'true' : undefined}
		focusable="false"
		class="block h-auto shrink-0 {legend ? 'sm:col-start-1 sm:row-span-2 sm:row-start-1' : ''}"
		style:width={size ? `${size}px` : '100%'}
		style:max-width={legend ? '26rem' : undefined}
	>
		<desc id="{uid}-desc">{alt}</desc>
		<rect width={VIEW} height={VIEW} fill={STORY_PAPER} />
		{#if geo.lines.length > 0}
			<g {...hit('lines')}>
				<title>{label('lines')}</title>
				{#each geo.lines as y (y)}
					{@const y1 = (y - 40).toFixed(1)}
					{@const y2 = (y + 40).toFixed(1)}
					<line
						x1="0"
						{y1}
						x2={VIEW}
						{y2}
						stroke={STORY_INK}
						stroke-width={active === 'lines' ? THICK : hair}
					/>
					<!-- Unsichtbare breite Linie als Trefferfläche für den Hover. -->
					<line x1="0" {y1} x2={VIEW} {y2} stroke="transparent" stroke-width="12" />
				{/each}
			</g>
		{/if}
		<g>
			{#if geo.circle}
				<g {...hit('circle')}>
					<title>{label('circle')}</title>
					<circle
						cx={geo.circle.cx.toFixed(1)}
						cy={geo.circle.cy.toFixed(1)}
						r={geo.circle.r.toFixed(1)}
						fill={colors.kreis.hex}
						stroke={STORY_INK}
						stroke-width={outline('circle')}
					/>
				</g>
			{/if}
			{#if geo.square}
				<g {...hit('square')}>
					<title>{label('square')}</title>
					<rect
						x={geo.square.x.toFixed(1)}
						y={geo.square.y.toFixed(1)}
						width={geo.square.size.toFixed(1)}
						height={geo.square.size.toFixed(1)}
						fill={colors.quadrat.hex}
						stroke={STORY_INK}
						stroke-width={outline('square')}
					/>
				</g>
			{/if}
			{#if geo.triangle}
				<g {...hit('triangle')}>
					<title>{label('triangle')}</title>
					<!-- Gelb auf Papier hat 1,41:1. Die Tinten-Haarlinie sichert 3:1 (WCAG 1.4.11). -->
					<path
						d={triangleD(geo.triangle)}
						fill={colors.dreieck.hex}
						stroke={STORY_INK}
						stroke-width={active === 'triangle' ? THICK : hair}
						stroke-linejoin="round"
					/>
				</g>
			{/if}
			{#if geo.donut}
				<g {...hit('donut')}>
					<title>{label('donut')}</title>
					<circle
						cx={geo.donut.cx.toFixed(1)}
						cy={geo.donut.cy.toFixed(1)}
						r={(donutR * 0.72).toFixed(1)}
						fill="none"
						stroke={colors.donut.hex}
						stroke-width={(donutR * 0.56).toFixed(1)}
					/>
					{#if active === 'donut'}
						{#each [1, 0.44] as factor (factor)}
							<circle
								cx={geo.donut.cx.toFixed(1)}
								cy={geo.donut.cy.toFixed(1)}
								r={(donutR * factor).toFixed(1)}
								fill="none"
								stroke={STORY_INK}
								stroke-width={THICK}
							/>
						{/each}
					{/if}
				</g>
			{/if}
		</g>
		{#if geo.bar}
			<g {...hit('bar')}>
				<title>{label('bar')}</title>
				<rect
					x={geo.bar.x.toFixed(1)}
					y={geo.bar.y.toFixed(1)}
					width={geo.bar.w.toFixed(1)}
					height={geo.bar.h}
					fill={colors.balken.hex}
					stroke={active === 'bar' ? STORY_INK : 'none'}
					stroke-width={active === 'bar' ? THICK : 0}
					transform="rotate({geo.bar.rot} {VIEW / 2} {VIEW / 2})"
				/>
			</g>
		{/if}
		<rect
			x=".5"
			y=".5"
			width={VIEW - 1}
			height={VIEW - 1}
			fill="none"
			stroke={STORY_INK}
			stroke-width={hair}
			pointer-events="none"
		/>
	</svg>
{/snippet}

{#if bare}
	{@render board()}
{:else}
	<figure
		data-testid="plk"
		data-slug={kennzahlen.slug}
		aria-hidden={decorative ? 'true' : undefined}
		class="m-0 flex flex-col gap-4 {legend
			? 'p-4 sm:grid sm:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] sm:items-start sm:gap-x-8 sm:p-6'
			: ''}"
		style:background-color={legend ? STORY_PAPER : undefined}
		style:color={STORY_INK}
		style:font-family={STORY_FONT}
	>
		{@render board()}

		{#if legend}
			<figcaption class="text-2xl leading-tight font-semibold sm:col-start-2 sm:row-start-1">
				{displayName}
			</figcaption>
			<ul
				data-testid="plk-legend"
				aria-label={m.plk_legend_label()}
				class="m-0 grid list-none gap-1 p-0 sm:col-start-2 sm:row-start-2"
			>
				{#each rows as r (r.key)}
					<li
						data-testid="plk-legend-{r.key}"
						data-active={active === r.key ? 'true' : undefined}
						onpointerenter={() => (hovered = exists(r.key) ? r.key : null)}
						onpointerleave={() => (hovered = null)}
						class="flex min-h-(--target-min) items-center gap-3 border-b px-1 py-1"
						style:border-color={active === r.key ? STORY_INK : 'transparent'}
					>
						<svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true" class="shrink-0">
							{#if r.key === 'circle'}
								<circle cx="13" cy="13" r="12" fill={r.color} />
							{:else if r.key === 'square'}
								<rect x="2" y="2" width="22" height="22" fill={r.color} />
							{:else if r.key === 'triangle'}
								<path
									d="M1,25l24,0l-12,-22Z"
									fill={r.color}
									stroke={STORY_INK}
									stroke-width={THIN}
									stroke-linejoin="round"
								/>
							{:else if r.key === 'bar'}
								<rect x="0" y="9" width="26" height="7" fill={r.color} />
							{:else if r.key === 'lines'}
								<path d="M0,4l26,11M0,12l26,11" stroke={r.color} stroke-width={THIN} />
							{:else}
								<circle cx="13" cy="13" r="8.5" fill="none" stroke={r.color} stroke-width="6.5" />
							{/if}
						</svg>
						<span class="flex min-w-0 flex-col text-base leading-tight">
							<span>{r.label}</span>
							<span class="text-lg tabular-nums">{r.value}</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</figure>
{/if}
