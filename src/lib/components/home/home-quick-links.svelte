<!--
	Story 2.12 T2: Quick-Links — 5 Berliner Landmarks als Pre-Adress-Buttons.

	Klick führt auf `/explore?address=lng,lat&q=…`. Atlas (Story 1.7) parsed
	das Address-Query automatisch und rendert mit ausgewählter Adresse +
	geöffnetem Inspector. Probier-Pfad für Erst-Besucher die keinen eigenen
	Adress-Anchor haben.
-->
<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { lineItem, lineList, lineRow } from './internal/line-list.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import {
		HOME_QUICK_LINKS,
		buildQuickLinkHref,
		homeQuickLinkDescription
	} from '$lib/content/home-quick-links.js';
</script>

<section data-testid="home-quick-links" class="space-y-4">
	<header class="space-y-2">
		<h2 class="text-2xl font-bold text-ink md:text-3xl">{m.home_quick_links_heading()}</h2>
		<p class="text-base text-ink-muted">
			{m.home_quick_links_lead()}
		</p>
	</header>
	<ul class="{lineList} sm:grid-cols-2 lg:grid-cols-3">
		{#each HOME_QUICK_LINKS as q (q.id)}
			<li class={lineItem}>
				<a
					href={localizedHref(buildQuickLinkHref(q))}
					data-testid={`home-quick-link-${q.id}`}
					title={homeQuickLinkDescription(q.id)}
					class="{lineRow} flex-row! items-center gap-2!"
				>
					<MapPin size={14} aria-hidden="true" class="shrink-0" />
					{q.label}
				</a>
			</li>
		{/each}
	</ul>
</section>
