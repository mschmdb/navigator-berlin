<!--
	Story 2.11 Hook-Section nach dem Hero. Screenshot + 2 Sätze: Lärmpegel
	einer Adresse, Hitze-Klasse eines Kiezes, ÖPNV-Dichte pro Bezirk. Story
	2.12 ersetzt `screenshotSrc` durch eine Browser-Capture-Pipeline; bis
	dahin Brand-Card als Fallback.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { HOME_SCREENSHOTS, homeScreenshotAlt } from '$lib/content/screenshot-manifest.js';

	const HERO = HOME_SCREENSHOTS.heroHook;

	interface Props {
		readonly mapHref?: string;
		readonly screenshotSrc?: string;
		readonly screenshotAlt?: string;
	}

	const {
		mapHref = '/explore',
		screenshotSrc = HERO.path,
		screenshotAlt = homeScreenshotAlt('heroHook')
	}: Props = $props();
</script>

<section
	data-testid="home-hook"
	class="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-10"
>
	<div class="space-y-5 md:order-2">
		<p class="font-serif text-xl leading-relaxed text-ink md:text-2xl">
			{m.home_hook_lead()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			{m.home_hook_body()}
		</p>
		<a
			href={localizedHref(mapHref)}
			class="inline-flex items-center gap-2 font-mono text-sm tracking-wider text-accent uppercase hover:text-ink"
		>
			{m.home_hero_cta_map()}
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
	<a
		href={localizedHref(mapHref)}
		aria-label={m.home_hero_cta_map()}
		class="group bg-bg-soft block overflow-hidden rounded border border-rule transition-colors hover:border-ink-muted md:order-1"
	>
		<figure>
			<img
				src={screenshotSrc}
				alt={screenshotAlt}
				class="block h-full w-full object-cover transition-opacity group-hover:opacity-90"
				loading="lazy"
				width={HERO.width}
				height={HERO.height}
			/>
			<figcaption class="sr-only">
				{m.home_hook_figcaption()}
			</figcaption>
		</figure>
	</a>
</section>
