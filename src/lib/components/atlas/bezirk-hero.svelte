<!--
	L5: Hero der Bezirksseite. Der erste Bildschirm zeigt H1, Fakten (Einwohner:innen,
	Fläche, Bezirks-Rang), die statische Kiez-Karte und den Button zur interaktiven
	Karte (`/explore?bezirk=<slug>`). Prosa, Vergleich, Steckbrief und FAQ folgen
	in `bezirk-details.svelte` unterhalb der Kiez-Liste.

	Rang über `formatRank` (Anti-Stigma, ADR-015). Ohne DB fehlt der Rang.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { BezirkProfile } from '$lib/data/types.js';
	import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
	import type { CompositeRank } from '$lib/server/profile/composite-rank.js';
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import { formatKm2, formatStichtag } from '$lib/seo/profile-meta.js';
	import { formatRank } from '$lib/data/rank-format.js';
	import { buildRegionFocusHref } from '$lib/utils/url-state.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { formatCount } from '$lib/i18n/format.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import BezirkKiezeMap from './bezirk-kieze-map.svelte';

	interface Props {
		readonly profile: BezirkProfile;
		readonly kieze: readonly KiezListEntry[];
		readonly outline: RegionOutline | null;
		readonly compositeRank: CompositeRank;
		/** ISO-Stichtag der Einwohnerzahl, `null` wenn unbekannt. */
		readonly einwohnerStichtag: string | null;
	}

	const { profile, kieze, outline, compositeRank, einwohnerStichtag }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const stand = $derived(formatStichtag(einwohnerStichtag, localeOpts.locale));
	const flaecheKm2 = $derived(formatKm2(profile.flaecheHa, localeOpts.locale));
	const rankText = $derived(
		formatRank(compositeRank.rang, compositeRank.quartil, compositeRank.total, localeOpts)
	);
	const hasRank = $derived(compositeRank.rang !== null && compositeRank.total > 0);
	const mapHref = $derived(localizedHref(buildRegionFocusHref('bezirk', profile.slug)));
</script>

<header class="mx-auto max-w-3xl space-y-4 px-4 pt-4 pb-8" data-testid="bezirk-hero">
	<div class="space-y-3">
		<p class="m-0 font-mono text-xs tracking-wide text-ink-subtle uppercase">
			{m.bezirk_hero_eyebrow(undefined, localeOpts)}
		</p>
		<h1 class="font-serif text-2xl text-ink sm:text-3xl md:text-4xl">{profile.name}</h1>
		<dl
			class="m-0 grid grid-cols-3 gap-x-4 gap-y-2 font-sans sm:flex sm:flex-wrap sm:gap-x-8"
			data-testid="bezirk-facts"
		>
			{#if profile.einwohner > 0}
				<div>
					<dt class="text-xs text-ink-muted sm:text-sm">
						{m.bezirk_hero_fact_einwohner(undefined, localeOpts)}
					</dt>
					<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">
						{formatCount(profile.einwohner, localeOpts)}
					</dd>
				</div>
			{/if}
			{#if profile.flaecheHa > 0}
				<div>
					<dt class="text-xs text-ink-muted sm:text-sm">
						{m.bezirk_hero_fact_flaeche(undefined, localeOpts)}
					</dt>
					<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">
						{m.bezirk_hero_fact_flaeche_value({ km2: flaecheKm2 }, localeOpts)}
					</dd>
				</div>
			{/if}
			{#if hasRank}
				<div data-testid="bezirk-rank-fact">
					<dt class="text-xs text-ink-muted sm:text-sm">
						{m.bezirk_hero_fact_rang(undefined, localeOpts)}
					</dt>
					<dd class="m-0 font-serif text-lg text-ink sm:text-2xl">{rankText}</dd>
				</div>
			{/if}
		</dl>
		{#if stand && profile.einwohner > 0}
			<p class="m-0 font-sans text-sm text-ink-muted">
				{m.bezirk_hero_fact_stand({ stand }, localeOpts)}
			</p>
		{/if}
	</div>

	<BezirkKiezeMap {outline} {kieze} bezirkName={profile.name} />

	<a
		href={mapHref}
		onclick={() => trackLanding('map_button', 'bezirk')}
		data-testid="bezirk-map-button"
		class="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-sans text-base font-semibold text-bg hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
	>
		{m.bezirk_hero_map_button({ bezirk: profile.name }, localeOpts)}
		<ArrowRight class="size-5" aria-hidden="true" />
	</a>
</header>
