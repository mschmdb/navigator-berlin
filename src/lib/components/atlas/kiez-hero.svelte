<!--
	L2: Hero der Kiez-Seite. Der erste Bildschirm zeigt Eyebrow (Link auf den Bezirk),
	H1, Fakten (Einwohner:innen, Fläche, Kiez-Score mit Rang, Stand), die Lage im
	Bezirk als statische SVG, einen Stärke-Satz und den Button zur Karte
	(`/explore?kiez=<slug>`). Gestalt: Textgruppe (mit Stärke-Satz) links, Kartenrahmen
	(`hero-map-card`, Button im Rahmen) rechts; mobil untereinander. Prosa, Score-Block, Vergleich, Steckbrief und FAQ
	folgen in `kiez-details.svelte`.

	Anti-Stigma (ADR-015): Rang über `formatRank` (unteres Viertel ohne „Platz X“).
	Stärke-Satz nur bei Gesamt-Quartil 1 bis 3 und einer Dimension im oberen
	Viertel; nie eine Schwäche. Ohne DB fehlen Score, Rang und Stärke.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { KiezProfile } from '$lib/data/types.js';
	import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
	import type { CompositeRank } from '$lib/server/profile/composite-rank.js';
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import type { ComparisonDimRow } from '$lib/data/comparison-types.js';
	import { pickKiezStrength } from '$lib/data/kiez-strength.js';
	import { normalizeSlug } from '$lib/data/internal/slug.js';
	import { formatKm2, formatStichtag } from '$lib/seo/profile-meta.js';
	import { formatRank } from '$lib/data/rank-format.js';
	import { buildRegionFocusHref } from '$lib/utils/url-state.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { formatCount } from '$lib/i18n/format.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { dimensionLabel } from './inspector-panel/internal/kiez-score-display.js';
	import KiezLocationMap from './kiez-location-map.svelte';
	import HeroMapCard from './hero-map-card.svelte';
	import { hasRenderableOutline } from './internal/has-renderable-outline.js';

	interface Props {
		readonly profile: KiezProfile;
		readonly score: KiezScore | null;
		readonly compositeRank: CompositeRank;
		readonly comparison?: readonly ComparisonDimRow[];
		readonly outline: RegionOutline | null;
		/** ISO-Stichtag der Einwohnerzahl, `null` wenn unbekannt. */
		readonly einwohnerStichtag: string | null;
	}

	const {
		profile,
		score,
		compositeRank,
		comparison = [],
		outline,
		einwohnerStichtag
	}: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const stand = $derived(formatStichtag(einwohnerStichtag, localeOpts.locale));
	const flaecheKm2 = $derived(formatKm2(profile.flaecheHa, localeOpts.locale));
	const bezirkHref = $derived(
		profile.bezirk.length > 0 ? localizedHref(`/bezirk/${normalizeSlug(profile.bezirk)}`) : null
	);
	const scoreValue = $derived(
		score !== null && Number.isFinite(score.composite) ? Math.round(score.composite) : null
	);
	const hasRank = $derived(compositeRank.rang !== null && compositeRank.total > 0);
	const rankText = $derived(
		formatRank(compositeRank.rang, compositeRank.quartil, compositeRank.total, localeOpts)
	);
	const strength = $derived(
		compositeRank.quartil !== null && compositeRank.quartil <= 3
			? pickKiezStrength(comparison)
			: null
	);
	const strengthText = $derived(
		strength
			? m.kiez_hero_strength(
					{
						dimension: dimensionLabel(strength.key, localeOpts),
						rang: strength.rang,
						total: strength.total
					},
					localeOpts
				)
			: null
	);
	const mapHref = $derived(localizedHref(buildRegionFocusHref('kiez', profile.slug)));
	const hasMap = $derived(hasRenderableOutline(outline, [profile.slug]));
	const mapTitle = $derived(
		profile.bezirk.length > 0
			? m.kiez_outline_title({ bezirk: profile.bezirk }, localeOpts)
			: m.kiez_outline_title_no_bezirk(undefined, localeOpts)
	);
</script>

<header class="mx-auto max-w-3xl px-4 pt-4 pb-8" data-testid="kiez-hero">
	<div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-6">
		<div class="space-y-3">
			<p class="m-0 font-mono text-xs tracking-wide text-ink-subtle uppercase">
				{#if bezirkHref}
					{m.kiez_hero_eyebrow(undefined, localeOpts)}
					<a
						href={bezirkHref}
						onclick={() => trackLanding('eyebrow_link', 'kiez')}
						class="inline-block py-1 text-ink-subtle underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
						data-testid="kiez-hero-bezirk-link">{profile.bezirk}</a
					>
				{:else}
					{m.kiez_hero_eyebrow_no_bezirk(undefined, localeOpts)}
				{/if}
			</p>
			<h1 class="font-serif text-2xl text-ink sm:text-3xl md:text-4xl">{profile.name}</h1>
			<dl
				class="m-0 grid grid-cols-2 gap-x-4 gap-y-2 font-sans sm:flex sm:flex-wrap sm:gap-x-8"
				data-testid="kiez-facts"
			>
				{#if profile.einwohner > 0}
					<div>
						<dt class="text-xs text-ink-muted sm:text-sm">
							{m.kiez_hero_fact_einwohner(undefined, localeOpts)}
						</dt>
						<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">
							{formatCount(profile.einwohner, localeOpts)}
							{#if stand}
								<span class="block font-sans text-xs text-ink-muted">
									{m.kiez_hero_fact_stand({ stand }, localeOpts)}
								</span>
							{/if}
						</dd>
					</div>
				{/if}
				{#if profile.flaecheHa > 0}
					<div>
						<dt class="text-xs text-ink-muted sm:text-sm">
							{m.kiez_hero_fact_flaeche(undefined, localeOpts)}
						</dt>
						<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">
							{m.kiez_hero_fact_flaeche_value({ km2: flaecheKm2 }, localeOpts)}
						</dd>
					</div>
				{/if}
				{#if scoreValue !== null}
					<div class="col-span-2 sm:col-span-1" data-testid="kiez-hero-score">
						<dt class="text-xs text-ink-muted sm:text-sm">
							{m.kiez_hero_fact_score(undefined, localeOpts)}
						</dt>
						<dd class="m-0 font-serif text-lg text-ink tabular-nums sm:text-2xl">
							{m.kiez_hero_score_value({ score: scoreValue }, localeOpts)}
							{#if hasRank}
								<span class="block font-sans text-xs text-ink-muted" data-testid="kiez-hero-rank"
									>{rankText}</span
								>
							{/if}
						</dd>
					</div>
				{/if}
			</dl>
			{#if strengthText}
				<p class="m-0 pt-1 font-serif text-base text-ink" data-testid="kiez-hero-strength">
					{strengthText}
				</p>
			{/if}
		</div>

		{#if hasMap}
			<HeroMapCard title={mapTitle} {description} {action}>
				<KiezLocationMap
					{outline}
					kiezSlug={profile.slug}
					kiezName={profile.name}
					bezirkName={profile.bezirk}
				/>
			</HeroMapCard>
		{:else}
			<div>{@render action()}</div>
		{/if}
	</div>
</header>

{#snippet description()}
	<p class="m-0" data-testid="kiez-outline-explain">
		{m.kiez_outline_explain({ kiez: profile.name }, localeOpts)}
	</p>
{/snippet}

{#snippet action()}
	<a
		href={mapHref}
		onclick={() => trackLanding('map_button', 'kiez')}
		data-testid="kiez-map-button"
		class="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-sans text-base font-semibold text-bg hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
	>
		{m.kiez_hero_map_button({ kiez: profile.name }, localeOpts)}
		<ArrowRight class="size-5" aria-hidden="true" />
	</a>
{/snippet}
