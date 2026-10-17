<!--
	L5: Hero der Bezirksseite. Der erste Bildschirm zeigt H1, Fakten (Einwohner:innen,
	Fläche, Rang unter den Bezirken), die statische Kiez-Karte und den Button zur interaktiven
	Karte (`/explore?bezirk=<slug>`). Gestalt: Textgruppe links, Kartenrahmen rechts
	(`hero-map-card`, Button im Rahmen); mobil untereinander. Prosa, Vergleich, Steckbrief und FAQ folgen
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
	import HeroMapCard from './hero-map-card.svelte';
	import { hasRenderableOutline } from './internal/has-renderable-outline.js';

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
	const scoreHref = $derived(localizedHref('/methodik/kiez-score'));
	const hasMap = $derived(
		hasRenderableOutline(
			outline,
			kieze.map((k) => k.slug)
		)
	);
</script>

<header class="mx-auto max-w-3xl px-4 pt-4 pb-8" data-testid="bezirk-hero">
	<div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-6">
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
							{#if stand}
								<span class="block font-sans text-xs text-ink-muted" data-testid="bezirk-stand">
									{stand}
								</span>
							{/if}
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
						<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">{rankText}</dd>
					</div>
				{/if}
			</dl>
		</div>

		{#if hasMap}
			<HeroMapCard title={m.bezirk_map_title(undefined, localeOpts)} {description} {action}>
				<BezirkKiezeMap {outline} {kieze} bezirkName={profile.name} />
			</HeroMapCard>
		{:else}
			<div>{@render action()}</div>
		{/if}
	</div>
</header>

{#snippet description()}
	<p class="m-0" data-testid="bezirk-score-explain">
		{m.bezirk_map_explain(undefined, localeOpts)}
		<a
			href={scoreHref}
			data-testid="bezirk-score-explain-link"
			class="inline-block py-1 text-ink underline underline-offset-2 hover:text-accent"
			>{m.bezirk_map_explain_link(undefined, localeOpts)}</a
		>
	</p>
{/snippet}

{#snippet action()}
	<a
		href={mapHref}
		onclick={() => trackLanding('map_button', 'bezirk')}
		data-testid="bezirk-map-button"
		class="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-sans text-base font-semibold text-bg hover:bg-ink"
	>
		{m.bezirk_hero_map_button({ bezirk: profile.name }, localeOpts)}
		<ArrowRight class="size-5" aria-hidden="true" />
	</a>
{/snippet}
