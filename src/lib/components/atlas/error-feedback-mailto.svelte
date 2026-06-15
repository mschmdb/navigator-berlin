<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import { buildErrorReportMailto } from '$lib/utils/contact.js';

	type Props = {
		layerSlug: string;
		layerName: string;
		displayName?: string;
		lat?: number;
		lng?: number;
		sourceUrl?: string;
		fetchedAt?: string;
	};

	let { layerSlug, layerName, displayName, lat, lng, sourceUrl, fetchedAt }: Props = $props();

	const mailtoUrl = $derived(
		buildErrorReportMailto({ layerSlug, layerName, displayName, lat, lng, sourceUrl, fetchedAt })
	);
</script>

<a
	href={mailtoUrl}
	data-testid="error-feedback-mailto"
	aria-label={`Fehler im Eintrag ${layerName} melden`}
	class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-sm text-accent underline underline-offset-2"
>
	<Mail size={14} aria-hidden="true" />
	<span>Fehler im Eintrag?</span>
</a>
