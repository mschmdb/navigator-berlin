<!--
	Vorschaubild aus der echten App (#170). Das ganze Bild ist ein Link auf den
	gezeigten Zustand. Maße verhindern einen Layout-Sprung.
-->
<script lang="ts">
	import { homePreviewSrc, type HomePreview } from '$lib/content/home-previews.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';

	interface Props {
		readonly preview: HomePreview;
		readonly alt: string;
		readonly class?: string;
		/** Doppelt zum Textlink daneben: aus Tab-Reihenfolge und Accessibility-Tree nehmen. */
		readonly decorative?: boolean;
		readonly imgClass?: string;
	}

	const {
		preview,
		alt,
		class: className = '',
		decorative = false,
		imgClass = ''
	}: Props = $props();
</script>

<a
	href={localizedHref(preview.path)}
	onclick={() => trackLanding('preview_link', 'home')}
	tabindex={decorative ? -1 : undefined}
	aria-hidden={decorative ? 'true' : undefined}
	data-testid={`home-preview-${preview.name}`}
	class="overflow-hidden rounded border border-rule bg-bg-muted {className}"
>
	<img
		src={homePreviewSrc(preview, getLocale() === 'en' ? 'en' : 'de')}
		{alt}
		width={preview.width}
		height={preview.height}
		loading="lazy"
		decoding="async"
		class="block h-auto w-full {imgClass}"
	/>
</a>
