<script lang="ts">
	import './pixel-logo.css';
	import {
		buildGeometry,
		initialFills,
		PALETTE,
		PRESET,
		seededRandom
	} from '$lib/data/pixel-logo-geometry';

	type Props = {
		/** one-shot: Raster steht, Farben wechseln im Takt. loop: Zellen bauen sich auf und wieder ab. */
		variant?: 'one-shot' | 'loop';
		size?: number;
		/** Barrierefreier Name. Leer lassen, wenn daneben schon die Wortmarke steht. */
		title?: string;
		/** Visually-hidden Statustext der loop-Variante. */
		loadingLabel?: string;
		/** Flächenfarbe hinter dem Raster. Standard: transparent. */
		background?: string;
		/** Farbwechsel-Takt. `prefers-reduced-motion: reduce` überstimmt das immer. */
		animate?: boolean;
		/** Abstand zwischen zwei Farbwechseln in Millisekunden. */
		interval?: number;
		/** Zellen, die je Takt neu eingefärbt werden. */
		perTick?: number;
		class?: string;
	};

	let {
		variant = 'one-shot',
		size = 240,
		title = 'navigator.berlin',
		loadingLabel = 'Wird geladen',
		background,
		animate = true,
		interval = 150,
		perTick = 11,
		class: className = ''
	}: Props = $props();

	// Ein Raster für alle Größen. Kleiner gerendert wird es feiner, nicht anders.
	const geometry = buildGeometry(PRESET);

	/**
	 * Kompaktes Markup: eine Zellform in `<defs>`, je Zelle nur ein `<use>` mit
	 * ganzzahliger Rasterposition. Die Gruppe skaliert Raster- in Viewbox-Einheiten.
	 */
	const step = 100 / PRESET.grid;
	const inset = (PRESET.gap / 100) * step;
	const unitSize = +(geometry.size / step).toFixed(4);
	const unitRadius = +(geometry.radius / step).toFixed(4);
	const rowMap = new Map<number, { col: number; index: number }[]>();
	geometry.cells.forEach((cell, index) => {
		const row = Math.round((cell.y - inset / 2) / step);
		const col = Math.round((cell.x - inset / 2) / step);
		const cells = rowMap.get(row) ?? [];
		cells.push({ col, index });
		rowMap.set(row, cells);
	});
	const gridRows = [...rowMap].sort(([a], [b]) => a - b).map(([row, cells]) => ({ row, cells }));
	const gridTransform = `translate(${+(inset / 2).toFixed(3)} ${+(inset / 2).toFixed(3)}) scale(${+step.toFixed(4)})`;
	const cellId = $props.id();

	/**
	 * Startfarben aus dem Seed statt aus `Math.random()`. Der Server rendert damit
	 * dasselbe Bild wie der Client, sonst reklamiert die Hydration jede Zelle.
	 * Der Farbwechsel-Takt legt seine Treffer als Overlay darüber, damit die
	 * Grundfarben deterministisch bleiben.
	 */
	const baseSwatches = initialFills(geometry.cells.length).map((color) =>
		Math.max(0, PALETTE.indexOf(color))
	);
	let shifted = $state<Record<number, number>>({});
	const swatches = $derived(geometry.cells.map((_, i) => shifted[i] ?? baseSwatches[i]));
	/** Palette als Custom Properties: Zellen tragen nur eine kurze Klasse `c<Index>`. */
	const paletteVars = PALETTE.map((color, i) => `--c${i}:${color}`).join(';');

	/**
	 * Einblend-Reihenfolge des Loaders. Gestreut, aber deterministisch, damit die
	 * Verzögerungen im SSR-Markup und nach der Hydration identisch bleiben.
	 */
	const stagger = seededRandom(PRESET.seed);
	const delays = geometry.cells.map(() => Math.round(stagger() * 900));

	let reducedMotion = $state(false);
	$effect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;
		const onChange = (event: MediaQueryListEvent) => (reducedMotion = event.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	$effect(() => {
		if (!animate || reducedMotion) return;
		const count = geometry.cells.length;
		const timer = setInterval(() => {
			for (let i = 0; i < perTick; i++) {
				shifted[Math.floor(Math.random() * count)] = Math.floor(Math.random() * PALETTE.length);
			}
		}, interval);
		return () => clearInterval(timer);
	});
</script>

{#snippet logo()}
	<svg
		data-testid="pixel-logo"
		viewBox="0 0 100 100"
		width={size}
		height={size}
		class="nv-pixel nv-pixel--{variant}"
		style={paletteVars}
		role={variant === 'one-shot' && title ? 'img' : undefined}
		aria-label={variant === 'one-shot' && title ? title : undefined}
		aria-hidden={variant === 'loop' || !title ? 'true' : undefined}
	>
		{#if variant === 'one-shot' && title}
			<title>{title}</title>
		{/if}
		{#if background}
			<rect data-role="backdrop" width="100" height="100" fill={background} />
		{/if}
		<defs><rect id={cellId} width={unitSize} height={unitSize} rx={unitRadius} /></defs>
		<g transform={gridTransform}>
			{#each gridRows as { row, cells } (row)}
				<svg y={row}>
					{#each cells as { col, index } (index)}
						<use
							href="#{cellId}"
							x={col}
							class="c{swatches[index]}"
							style={variant === 'loop' ? `--d:${delays[index]}ms` : undefined}
						/>
					{/each}
				</svg>
			{/each}
		</g>
	</svg>
{/snippet}

{#if variant === 'loop'}
	<span role="status" aria-live="polite" class={className} style:display="inline-flex">
		{@render logo()}
		<span class="sr-only">{loadingLabel}</span>
	</span>
{:else}
	<span class={className} style:display="inline-flex">
		{@render logo()}
	</span>
{/if}
