<script lang="ts">
	import {
		ANCHOR_POINTS,
		BOUNDARY_PATH_D,
		BOUNDARY_POINTS,
		DELAUNAY_EDGES
	} from '$lib/data/logo-geometry';

	type Props = {
		/** one-shot: einmaliger Build, bleibt final stehen. loop: rebuild-cycle als Loader. */
		variant?: 'one-shot' | 'loop';
		size?: number;
		title?: string;
		/** Visually-hidden Label für loop-variant (aria-live status). */
		loadingLabel?: string;
		/** Auto: <=64 → header-density (dicker), >64 → master. Override mit 'master'|'header'. */
		density?: 'auto' | 'master' | 'header';
		/** Optional class für Wrapper-Element. */
		class?: string;
	};

	let {
		variant = 'one-shot',
		size = 96,
		title = 'navigator.berlin',
		loadingLabel = 'Atlas wird geladen',
		density = 'auto',
		class: className = ''
	}: Props = $props();

	const resolvedDensity = $derived(
		density === 'auto' ? (size <= 64 ? 'header' : 'master') : density
	);
</script>

{#snippet logo()}
	<svg
		viewBox="0 0 100 100"
		width={size}
		height={size}
		class="nv-logo nv-logo--{variant} nv-logo--{resolvedDensity}"
		aria-hidden={variant === 'loop' ? 'true' : undefined}
		role={variant === 'one-shot' ? 'img' : undefined}
		aria-label={variant === 'one-shot' ? title : undefined}
	>
		{#if variant === 'one-shot'}
			<title>{title}</title>
		{/if}

		<g class="nv-logo__edges" stroke="var(--accent, #2A3F7C)" fill="none" stroke-linecap="round">
			{#each DELAUNAY_EDGES as [x1, y1, x2, y2], i (i)}
				<line
					class="nv-logo__edge"
					{x1}
					{y1}
					{x2}
					{y2}
					pathLength="100"
					style:--i={i}
				/>
			{/each}
		</g>

		<path
			class="nv-logo__boundary"
			d={BOUNDARY_PATH_D}
			fill="none"
			stroke="var(--accent, #2A3F7C)"
			stroke-linejoin="round"
			stroke-linecap="round"
			pathLength="100"
		/>

		<g class="nv-logo__points" fill="var(--accent, #2A3F7C)">
			{#each BOUNDARY_POINTS as [cx, cy], i (i)}
				<circle class="nv-logo__point" {cx} {cy} style:--i={i} />
			{/each}
		</g>

		<g
			class="nv-logo__anchors"
			fill="var(--bg, #ECEAE0)"
			stroke="var(--accent, #2A3F7C)"
		>
			{#each ANCHOR_POINTS as [cx, cy], i (i)}
				<circle class="nv-logo__anchor" {cx} {cy} style:--i={i} />
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

	.nv-logo {
		display: block;
	}

	.nv-logo__edge {
		stroke-dasharray: 100;
	}

	.nv-logo__boundary {
		stroke-dasharray: 100;
	}

	.nv-logo__point,
	.nv-logo__anchor {
		transform-box: fill-box;
		transform-origin: center;
	}

	/* Master-Density: feine Hairlines für >=64 px Render. */
	.nv-logo--master .nv-logo__edge {
		stroke-width: 0.4;
		opacity: 0.4;
	}
	.nv-logo--master .nv-logo__boundary {
		stroke-width: 0.8;
	}
	.nv-logo--master .nv-logo__point {
		r: 1.2;
	}
	.nv-logo--master .nv-logo__anchor {
		r: 0.9;
		stroke-width: 0.54;
	}

	/* Header-Density: verstärkte Strokes für 24–64 px (Sub-Pixel-Schutz). */
	.nv-logo--header .nv-logo__edge {
		stroke-width: 1.3;
		opacity: 0.55;
	}
	.nv-logo--header .nv-logo__boundary {
		stroke-width: 1.9;
	}
	.nv-logo--header .nv-logo__point {
		r: 2.2;
	}
	.nv-logo--header .nv-logo__anchor {
		r: 1.6;
		stroke-width: 0.96;
	}

	/* === ONE-SHOT === Build once, stay final. */

	.nv-logo--one-shot .nv-logo__boundary {
		stroke-dashoffset: 100;
		animation: nv-draw 1100ms cubic-bezier(0.65, 0, 0.35, 1) 0ms forwards;
	}

	.nv-logo--one-shot .nv-logo__point {
		opacity: 0;
		transform: scale(0);
		animation: nv-pop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: calc(700ms + var(--i) * 22ms);
	}

	.nv-logo--one-shot .nv-logo__anchor {
		opacity: 0;
		transform: scale(0);
		animation: nv-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: calc(1500ms + var(--i) * 80ms);
	}

	.nv-logo--one-shot .nv-logo__edge {
		stroke-dashoffset: 100;
		animation: nv-draw 380ms ease-out forwards;
		animation-delay: calc(1700ms + var(--i) * 35ms);
	}

	/* === LOOP === Build + hold + fade, repeat. Cycle 5s. */

	.nv-logo--loop .nv-logo__boundary {
		stroke-dashoffset: 100;
		animation: nv-cycle-boundary 5s cubic-bezier(0.65, 0, 0.35, 1) 0s infinite;
	}

	.nv-logo--loop .nv-logo__point {
		opacity: 0;
		transform: scale(0);
		animation: nv-cycle-pop 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		animation-delay: calc(var(--i) * 18ms - 500ms);
	}

	.nv-logo--loop .nv-logo__anchor {
		opacity: 0;
		transform: scale(0);
		animation: nv-cycle-pop 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		animation-delay: calc(var(--i) * 60ms - 250ms);
	}

	.nv-logo--loop .nv-logo__edge {
		stroke-dashoffset: 100;
		animation: nv-cycle-edge 5s ease-out infinite;
		animation-delay: calc(var(--i) * 25ms);
	}

	@keyframes nv-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes nv-pop {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes nv-cycle-boundary {
		0% {
			stroke-dashoffset: 100;
		}
		22% {
			stroke-dashoffset: 0;
		}
		78% {
			stroke-dashoffset: 0;
		}
		100% {
			stroke-dashoffset: 100;
		}
	}

	@keyframes nv-cycle-edge {
		0% {
			stroke-dashoffset: 100;
		}
		35% {
			stroke-dashoffset: 0;
		}
		78% {
			stroke-dashoffset: 0;
		}
		100% {
			stroke-dashoffset: 100;
		}
	}

	@keyframes nv-cycle-pop {
		0% {
			opacity: 0;
			transform: scale(0);
		}
		18% {
			opacity: 0;
			transform: scale(0);
		}
		28% {
			opacity: 1;
			transform: scale(1);
		}
		78% {
			opacity: 1;
			transform: scale(1);
		}
		88% {
			opacity: 0;
			transform: scale(0);
		}
		100% {
			opacity: 0;
			transform: scale(0);
		}
	}

	/* Reduced motion: zeige Final-State, keine Animation. */
	@media (prefers-reduced-motion: reduce) {
		.nv-logo__boundary,
		.nv-logo__edge {
			animation: none !important;
			stroke-dashoffset: 0;
		}
		.nv-logo__point,
		.nv-logo__anchor {
			animation: none !important;
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
