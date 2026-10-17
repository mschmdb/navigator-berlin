<!-- Story 14.10: Links auf Kiez- und Bezirks-Profil mit deren Composite-Score. Aus
     `inspector-panel.svelte` herausgelöst (GH-88, Datei unter 500 Zeilen). -->
<script lang="ts">
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { Locale } from '$lib/paraglide/runtime';

	type Props = {
		kiezSlug: string | null;
		kiezName: string | null;
		kiezComposite: number | null;
		bezirkSlug: string | null;
		bezirkName: string | null;
		bezirkComposite: number | null;
		lang: Locale;
	};
	let { kiezSlug, kiezName, kiezComposite, bezirkSlug, bezirkName, bezirkComposite, lang }: Props =
		$props();

	const localeOpts = $derived({ locale: lang });
</script>

{#if kiezSlug || bezirkSlug}
	<nav
		data-testid="inspector-profile-links"
		aria-label={m.inspector_profile_links_aria(undefined, localeOpts)}
		class="flex flex-col"
	>
		{#if kiezSlug}
			<div class="flex items-baseline justify-between gap-2">
				<a
					data-testid="inspector-kiez-link"
					class="inline-flex min-h-(--target-min) items-center font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
					href={localizedHref(`/kiez/${kiezSlug}`, lang)}
				>
					{kiezName
						? m.inspector_kiez_profile_link_named({ name: kiezName }, localeOpts)
						: m.inspector_kiez_profile_link_unnamed(undefined, localeOpts)}
				</a>
				{#if kiezComposite !== null}
					<span
						data-testid="inspector-kiez-composite"
						class="shrink-0 text-xs text-ink-muted tabular-nums"
						title={m.inspector_kiez_composite_title(undefined, localeOpts)}
					>
						{m.inspector_score_label({ value: String(Math.round(kiezComposite)) }, localeOpts)}
					</span>
				{/if}
			</div>
		{/if}
		{#if bezirkSlug}
			<div class="flex items-baseline justify-between gap-2">
				<a
					data-testid="inspector-bezirk-link"
					class="inline-flex min-h-(--target-min) items-center font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
					href={localizedHref(`/bezirk/${bezirkSlug}`, lang)}
				>
					{bezirkName
						? m.inspector_bezirk_profile_link_named({ name: bezirkName }, localeOpts)
						: m.inspector_bezirk_profile_link_unnamed(undefined, localeOpts)}
				</a>
				{#if bezirkComposite !== null}
					<span
						data-testid="inspector-bezirk-composite"
						class="shrink-0 text-xs text-ink-muted tabular-nums"
						title={m.inspector_bezirk_composite_title(undefined, localeOpts)}
					>
						{m.inspector_score_label({ value: String(Math.round(bezirkComposite)) }, localeOpts)}
					</span>
				{/if}
			</div>
		{/if}
	</nav>
{/if}
