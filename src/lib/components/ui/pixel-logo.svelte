<script lang="ts">
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
	 * Startfarben aus dem Seed statt aus `Math.random()`. Der Server rendert damit
	 * dasselbe Bild wie der Client, sonst reklamiert die Hydration jede Zelle.
	 * Der Farbwechsel-Takt legt seine Treffer als Overlay darüber, damit die
	 * Grundfarben deterministisch bleiben.
	 */
	const baseFills = initialFills(geometry.cells.length);
	let shifted = $state<Record<number, string>>({});
	const fills = $derived(geometry.cells.map((_, i) => shifted[i] ?? baseFills[i]));

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
				shifted[Math.floor(Math.random() * count)] =
					PALETTE[Math.floor(Math.random() * PALETTE.length)];
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
		{#each geometry.cells as cell, i (i)}
			<rect
				x={cell.x}
				y={cell.y}
				width={geometry.size}
				height={geometry.size}
				rx={geometry.radius}
				fill={fills[i]}
				style:--d="{delays[i]}ms"
			/>
		{/each}
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

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.nv-pixel {
		display: block;
	}

	.nv-pixel rect {
		transition: fill 700ms ease;
	}

	/* Loader: Zellen blenden gestreut ein, halten, blenden aus, Zyklus wiederholt.
	   Die Grundfläche bleibt stehen, sonst blinkt der ganze Kasten. */
	.nv-pixel--loop rect:not([data-role='backdrop']) {
		opacity: 0;
		animation: nv-pixel-cycle 2400ms ease-in-out infinite;
		animation-delay: var(--d, 0ms);
	}

	@keyframes nv-pixel-cycle {
		0% {
			opacity: 0;
		}
		18% {
			opacity: 1;
		}
		62% {
			opacity: 1;
		}
		84% {
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	/* Reduced Motion: volles Bild, kein Aufbau, kein Farbwechsel. */
	@media (prefers-reduced-motion: reduce) {
		.nv-pixel rect {
			transition: none;
		}
		.nv-pixel--loop rect {
			animation: none;
			opacity: 1;
		}
	}
</style>
