<script lang="ts">
	import { page } from '$app/state';
	import { ExternalLink } from '@lucide/svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments, type TagMarkers } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { buildAboutPage, buildBreadcrumbList, localeToBcp47 } from '$lib/seo/index.js';
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { UEBER_LINKS, isUeberLinkName, type UeberLinkName } from './ueber-links.js';

	const locale = $derived(getLocale());

	/** Erzeugt `{name_start}`/`{name_end}`-Argumente für die benannten Link-Platzhalter. */
	function markerArgs<const N extends UeberLinkName>(
		t: (name: string) => TagMarkers,
		names: readonly N[]
	): Record<`${N}_start` | `${N}_end`, string> {
		const args: Record<string, string> = {};
		for (const name of names) {
			args[`${name}_start`] = t(name).start;
			args[`${name}_end`] = t(name).end;
		}
		return args as Record<`${N}_start` | `${N}_end`, string>;
	}

	const projektP2 = $derived(
		richSegments((t) => m.ueber_projekt_p2(markerArgs(t, ['taz', 'hitze', 'kaelte', 'updates'])))
	);
	const personP2 = $derived(richSegments((t) => m.ueber_person_p2(markerArgs(t, ['mtc']))));
	const personP3 = $derived(
		richSegments((t) => m.ueber_person_p3(markerArgs(t, ['site', 'bluesky', 'linkedin'])))
	);
	const bauP3 = $derived(
		richSegments((t) => m.ueber_bau_p3(markerArgs(t, ['talk', 'architektur'])))
	);
	const haltungMethodik = $derived(
		richSegments((t) => m.ueber_haltung_methodik(markerArgs(t, ['methodik'])))
	);
	const datenP1 = $derived(
		richSegments((t) => m.ueber_daten_p1(markerArgs(t, ['lizenzen', 'daten'])))
	);
	const datenP2 = $derived(richSegments((t) => m.ueber_daten_p2(markerArgs(t, ['github']))));
	const kontaktP1 = $derived(
		richSegments((t) =>
			m.ueber_kontakt_p1({
				...markerArgs(t, ['mail', 'impressum', 'datenschutz']),
				email: FEEDBACK_EMAIL
			})
		)
	);

	const siteOrigin = $derived(canonicalOrigin(page.url.origin));
	const title = $derived(m.ueber_meta_title());
	const description = $derived(m.ueber_meta_description());

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: siteOrigin,
			items: [
				{ name: 'Berlin', path: localizedPathname('/', locale) },
				{ name: m.ueber_breadcrumb(), path: localizedPathname('/ueber', locale) }
			]
		})
	);
	const aboutPageJsonLd = $derived(
		buildAboutPage({
			origin: siteOrigin,
			name: title,
			description,
			urlPath: localizedPathname('/ueber', locale),
			inLanguage: localeToBcp47(locale)
		})
	);

	const linkClass = 'hover:text-accent-strong text-accent underline underline-offset-2';
	const bodyClass = 'font-serif text-base leading-relaxed text-ink';
</script>

{#snippet link(text: string, name: string)}
	{@const target = isUeberLinkName(name) ? UEBER_LINKS[name] : undefined}
	{#if !target}
		{text}
	{:else if target.kind === 'internal'}
		<a href={localizedHref(target.path)} class={linkClass}>{text}</a>
	{:else if target.kind === 'mail'}
		<a href={target.url} class={linkClass}>{text}</a>
	{:else}
		<a
			href={target.url}
			hreflang={target.hreflang}
			lang={target.textLang}
			target="_blank"
			rel="noopener noreferrer"
			class={linkClass}
			>{text}<ExternalLink class="mb-0.5 ml-0.5 inline size-3.5" aria-hidden="true" /><span
				class="sr-only"
			>
				{m.ueber_new_tab_hint()}</span
			></a
		>
	{/if}
{/snippet}

<SeoHead
	title={buildPageTitle(title)}
	{description}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/ueber.png`}
	ogImageAlt={m.ueber_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="ueber-breadcrumb-jsonld" />
<JsonLd data={aboutPageJsonLd} testid="ueber-aboutpage-jsonld" />

<article data-testid="ueber-page" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<h1 class="font-serif text-3xl text-ink">{m.ueber_h1()}</h1>

	<section aria-labelledby="ueber-kurz-h" class="flex flex-col gap-3">
		<h2 id="ueber-kurz-h" class="font-serif text-2xl text-ink">{m.ueber_kurz_h()}</h2>
		<p class={bodyClass}>{m.ueber_kurz_p1()}</p>
	</section>

	<section aria-labelledby="ueber-projekt-h" class="flex flex-col gap-3">
		<h2 id="ueber-projekt-h" class="font-serif text-2xl text-ink">{m.ueber_projekt_h()}</h2>
		<p class={bodyClass}>{m.ueber_projekt_p1()}</p>
		<p class={bodyClass}>
			<RichText segments={projektP2} tag={link} />
		</p>
	</section>

	<section aria-labelledby="ueber-person-h" class="flex flex-col gap-3">
		<h2 id="ueber-person-h" class="font-serif text-2xl text-ink">{m.ueber_person_h()}</h2>
		<p class={bodyClass}>{m.ueber_person_p1()}</p>
		<p class={bodyClass}>
			<RichText segments={personP2} tag={link} />
		</p>
		<p class={bodyClass}>
			<RichText segments={personP3} tag={link} />
		</p>
	</section>

	<section aria-labelledby="ueber-bau-h" class="flex flex-col gap-3">
		<h2 id="ueber-bau-h" class="font-serif text-2xl text-ink">{m.ueber_bau_h()}</h2>
		<p class={bodyClass}>{m.ueber_bau_p1()}</p>
		<p class={bodyClass}>{m.ueber_bau_p2()}</p>
		<p class={bodyClass}>
			<RichText segments={bauP3} tag={link} />
		</p>
	</section>

	<section aria-labelledby="ueber-haltung-h" class="flex flex-col gap-3">
		<h2 id="ueber-haltung-h" class="font-serif text-2xl text-ink">{m.ueber_haltung_h()}</h2>
		<ul class="{bodyClass} flex list-disc flex-col gap-2 pl-6">
			<li>{m.ueber_haltung_finanzierung()}</li>
			<li>{m.ueber_haltung_cookies()}</li>
			<li>{m.ueber_haltung_score()}</li>
			<li>{m.ueber_haltung_quelle()}</li>
		</ul>
		<p class={bodyClass}>
			<RichText segments={haltungMethodik} tag={link} />
		</p>
	</section>

	<section aria-labelledby="ueber-daten-h" class="flex flex-col gap-3">
		<h2 id="ueber-daten-h" class="font-serif text-2xl text-ink">{m.ueber_daten_h()}</h2>
		<p class={bodyClass}>
			<RichText segments={datenP1} tag={link} />
		</p>
		<p class={bodyClass}>
			<RichText segments={datenP2} tag={link} />
		</p>
	</section>

	<section aria-labelledby="ueber-kontakt-h" class="flex flex-col gap-3">
		<h2 id="ueber-kontakt-h" class="font-serif text-2xl text-ink">{m.ueber_kontakt_h()}</h2>
		<p class={bodyClass}>
			<RichText segments={kontaktP1} tag={link} />
		</p>
	</section>
</article>
