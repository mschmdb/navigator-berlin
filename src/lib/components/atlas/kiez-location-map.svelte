<!--
	L2: Statische Lage-Grafik eines Kiezes im Bezirk. Alle Kieze des Bezirks hellgrau,
	der aktuelle Kiez in Akzentfarbe. Nicht interaktiv, kein MapLibre. `role="img"`
	mit Beschreibung; die Konturen sichern 3:1 gegen den Hintergrund. Die übrigen
	Kieze teilen sich einen Pfad, damit das HTML klein bleibt.
-->
<script lang="ts">
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { NO_SCORE_FILL } from './internal/score-class-color.js';

	interface Props {
		readonly outline: RegionOutline | null;
		readonly kiezSlug: string;
		readonly kiezName: string;
		readonly bezirkName: string;
	}

	const { outline, kiezSlug, kiezName, bezirkName }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const current = $derived(outline?.paths.find((p) => p.id === kiezSlug) ?? null);
	const others = $derived(
		(outline?.paths ?? [])
			.filter((p) => p.id !== kiezSlug)
			.map((p) => p.d)
			.join('')
	);
</script>

{#if outline && current}
	<svg
		viewBox={outline.viewBox}
		role="img"
		aria-label={m.kiez_outline_aria({ kiez: kiezName, bezirk: bezirkName }, localeOpts)}
		class="block h-auto max-h-36 w-full sm:max-h-64"
		preserveAspectRatio="xMidYMid meet"
		data-testid="kiez-location-map"
	>
		<path
			d={others}
			fill={NO_SCORE_FILL}
			stroke="var(--rule-strong)"
			stroke-width="1.5"
			vector-effect="non-scaling-stroke"
			stroke-linejoin="round"
			fill-rule="evenodd"
			data-testid="kiez-location-others"
		/>
		<path
			d={current.d}
			fill="var(--accent)"
			stroke="var(--ink)"
			stroke-width="2"
			vector-effect="non-scaling-stroke"
			stroke-linejoin="round"
			fill-rule="evenodd"
			data-testid="kiez-location-current"
		/>
	</svg>
{/if}
