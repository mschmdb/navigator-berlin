<!--
	Kontextlinks von Kiez- und Bezirksseiten zu den Übersichtsseiten (S8).
	Der Kiez-Link springt in den Bezirksabschnitt auf /kieze; die Anker-ID
	kommt aus derselben Funktion wie die Sprungziele der Übersicht.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { bezirkAnchorId } from '$lib/data/region-overview.js';

	interface Props {
		readonly kind: 'kiez' | 'bezirk';
		readonly bezirkName: string;
		readonly bezirkSlug: string | null;
	}

	const { kind, bezirkName, bezirkSlug }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const linkClass = 'hover:text-accent-strong text-accent underline underline-offset-2';

	const bezirk = $derived(
		bezirkName.length > 0 && bezirkSlug !== null && bezirkSlug.length > 0
			? { name: bezirkName, slug: bezirkSlug }
			: null
	);
	// Hash außerhalb der Locale-Logik anhängen, localizedHref kennt nur Pfade.
	const kiezeHref = $derived(
		bezirk ? `${localizedHref('/kieze')}#${bezirkAnchorId(bezirk.slug)}` : localizedHref('/kieze')
	);
	const kiezeLabel = $derived(
		bezirk
			? m.overview_link_kieze_in_bezirk({ bezirk: bezirk.name }, localeOpts)
			: m.overview_link_all_kieze(undefined, localeOpts)
	);
</script>

<p class="flex flex-col gap-2 font-sans text-base">
	<a href={kiezeHref} data-testid="overview-link-kieze" class={linkClass}>{kiezeLabel}</a>
	{#if kind === 'bezirk'}
		<a href={localizedHref('/bezirke')} data-testid="overview-link-bezirke" class={linkClass}>
			{m.overview_link_all_bezirke(undefined, localeOpts)}
		</a>
	{/if}
</p>
