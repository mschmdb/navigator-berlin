<!--
	Startseite: Fragetitel, ein Satz, großes Suchfeld und drei Beispiel-Adressen.
	Die Suche ist der Haupteinstieg. Eine gewählte Adresse öffnet die Karte
	(`/explore?address=lng,lat&q=…`). Beispiele sind normale Links.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AddressSearch from '$lib/components/atlas/address-search.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import {
		HOME_SEARCH_EXAMPLES,
		buildQuickLinkHref,
		buildSearchTargetHref
	} from '$lib/content/home-quick-links.js';
	import { HOME_PREVIEWS } from '$lib/content/home-previews.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import HomePreviewLink from './home-preview-link.svelte';

	interface Props {
		/** Injizierbar für Tests; Default = Remote-Query `geocodeAddress`. */
		readonly geocode?: (q: string) => Promise<GeocodeSuggestion[]>;
		/** Injizierbar für Tests; Default = SvelteKit `goto`. */
		readonly navigate?: (href: string) => unknown;
	}

	const {
		geocode = async (q: string) => await geocodeAddress({ q }),
		navigate = (href: string) => goto(href)
	}: Props = $props();

	function onSelect(s: GeocodeSuggestion): void {
		void navigate(localizedHref(buildSearchTargetHref(s)));
	}
</script>

<section data-testid="home-search-hero" class="grid items-center gap-10 md:grid-cols-2">
	<div class="space-y-6">
		<h1 class="text-3xl font-bold text-ink md:text-4xl">{m.home_search_title()}</h1>
		<p class="max-w-(--measure) text-lg leading-body text-ink-muted">{m.home_search_lead()}</p>
		<div class="max-w-2xl space-y-3">
			<AddressSearch
				variant="hero"
				{geocode}
				{onSelect}
				placeholder={m.shell_address_search_placeholder()}
				notFoundLabel={m.shell_address_search_not_found()}
				noSuggestionsLabel={m.shell_address_search_no_suggestions()}
				suggestionsCountLabel={(count) =>
					(count === 1
						? m.shell_address_search_suggestions_count_singular
						: m.shell_address_search_suggestions_count_plural)({ count })}
			/>
			<div
				data-testid="home-search-examples"
				class="flex flex-wrap items-center gap-x-4 text-base text-ink-muted"
			>
				<span id="home-search-examples-label">{m.home_search_examples_label()}</span>
				<ul aria-labelledby="home-search-examples-label" class="flex flex-wrap gap-x-4">
					{#each HOME_SEARCH_EXAMPLES as e (e.id)}
						<li>
							<a
								href={localizedHref(buildQuickLinkHref(e))}
								onclick={() => trackLanding('search_example', 'home')}
								class="inline-flex min-h-(--target-min) items-center text-ink underline underline-offset-4 hover:text-accent"
							>
								{e.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
	<HomePreviewLink
		preview={HOME_PREVIEWS['kiez-score']}
		alt={m.home_preview_kiez_score_alt()}
		class="hidden md:block"
	/>
</section>
