<!--
	Vertrauensfuß: Quellen, keine Cookies, Links zu Methodik, Daten, Lizenzen, Über.
-->
<script lang="ts">
	import { HOME_DATA_SOURCES } from '$lib/content/home-data-sources.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';

	const sources = $derived(HOME_DATA_SOURCES.map((s) => s.name).join('; '));

	const links = $derived([
		{ href: '/methodik', label: m.home_trust_link_methodik() },
		{ href: '/daten', label: m.home_trust_link_daten() },
		{ href: '/lizenzen', label: m.home_trust_link_lizenzen() },
		{ href: '/ueber', label: m.home_trust_link_ueber() }
	]);
</script>

<section data-testid="home-trust" class="space-y-3 border-t border-rule pt-8">
	<h2 class="text-xl font-bold text-ink">{m.home_trust_title()}</h2>
	<p class="max-w-(--measure) text-base text-ink-muted">{m.home_trust_sources({ sources })}</p>
	<p class="max-w-(--measure) text-base text-ink-muted">{m.home_trust_privacy()}</p>
	<p class="max-w-(--measure) text-base text-ink-muted">{m.home_trust_neutral()}</p>
	<nav aria-label={m.home_trust_nav_label()}>
		<ul class="flex flex-wrap gap-x-6">
			{#each links as link (link.href)}
				<li>
					<a
						href={localizedHref(link.href)}
						class="inline-flex min-h-(--target-min) items-center text-base text-ink underline underline-offset-4 hover:text-accent"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</section>
