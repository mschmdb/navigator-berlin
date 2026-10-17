<!--
	Story 2.11 Featured-Bezirke. 4 editorial-fixed Slugs mit jeweils einer
	kurzen Sub-Line damit die Cards Substanz statt nur Name haben. Story 2.12
	ersetzt Liste durch src/lib/content/home-featured-bezirke.ts inkl.
	Rationale-Kommentar pro Auswahl.
-->
<script lang="ts">
	import { ctaSecondary } from './internal/cta.js';
	import { lineItem, lineList, lineRow } from './internal/line-list.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import {
		HOME_FEATURED_BEZIRKE,
		homeFeaturedBezirkTeaser
	} from '$lib/content/home-featured-bezirke.js';
</script>

<section data-testid="home-featured-bezirke" class="space-y-6">
	<header class="space-y-2">
		<h2 class="text-2xl font-bold text-ink md:text-3xl">{m.home_featured_bezirke_heading()}</h2>
		<p class="text-base text-ink-muted">
			{m.home_featured_bezirke_lead()}
		</p>
	</header>
	<ul class="{lineList} md:grid-cols-2">
		{#each HOME_FEATURED_BEZIRKE as b (b.slug)}
			<li class={lineItem}>
				<a href={localizedHref(`/bezirk/${b.slug}`)} class={lineRow}>
					<span class="text-lg font-semibold">{b.displayName}</span>
					<span class="text-sm leading-snug text-ink-muted">{homeFeaturedBezirkTeaser(b.slug)}</span
					>
				</a>
			</li>
		{/each}
	</ul>
	<a href={localizedHref('/umwelt-infrastruktur-score?view=bezirke')} class={ctaSecondary}>
		{m.home_featured_bezirke_all_link()}
	</a>
</section>
