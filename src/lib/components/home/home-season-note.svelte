<!--
	Eine Zeile Saisonhinweis: Kälte-Navigator in der Kältehilfe-Saison
	(1.10. bis 30.4., Berliner Zeit), sonst Hitze-Navigator.
-->
<script lang="ts">
	import { isKaelteSaison } from '$lib/utils/berlin-time.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';

	let { now = new Date() }: { now?: Date } = $props();

	const kaelte = $derived(isKaelteSaison(now));
</script>

<p
	data-testid="home-season-note"
	class="flex flex-wrap items-center gap-x-3 border-y border-rule py-2 text-base text-ink"
>
	<span>{kaelte ? m.home_season_kaelte_text() : m.home_season_hitze_text()}</span>
	<a
		href={localizedHref(kaelte ? '/kaelte' : '/hitze')}
		class="inline-flex min-h-(--target-min) items-center font-medium underline underline-offset-4 hover:text-accent"
	>
		{kaelte ? m.home_kaelte_cta_landing() : m.home_hitze_cta_landing()}
	</a>
</p>
