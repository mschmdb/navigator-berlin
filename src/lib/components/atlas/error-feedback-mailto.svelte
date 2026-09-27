<!--
	i18n Block B4b: sichtbarer Text + Aria-Label über Messages. Der Mailto-Body
	(`buildErrorReportMailto`) bleibt bewusst deutsch (Koordinator-Entscheidung,
	Matze AFK) -- er geht an die Redaktion, nicht an Leser:innen der Seite.
	Review-Fund #20: `layerName` (Subject + Body) muss deshalb IMMER der
	deutsche Layer-Name sein, auch auf `/en`. `ariaLayerName` ist der davon
	getrennte, locale-fähige Name fürs sichtbare Aria-Label; Aufrufer ohne
	eigenen Wert bekommen `layerName` als Fallback (bestehendes DE-Verhalten
	bleibt unveraendert).
-->
<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import { buildErrorReportMailto } from '$lib/utils/contact.js';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		layerSlug: string;
		layerName: string;
		ariaLayerName?: string;
		displayName?: string;
		lat?: number;
		lng?: number;
		sourceUrl?: string;
		fetchedAt?: string;
	};

	let { layerSlug, layerName, ariaLayerName, displayName, lat, lng, sourceUrl, fetchedAt }: Props =
		$props();

	const mailtoUrl = $derived(
		buildErrorReportMailto({ layerSlug, layerName, displayName, lat, lng, sourceUrl, fetchedAt })
	);
</script>

<a
	href={mailtoUrl}
	data-testid="error-feedback-mailto"
	aria-label={m.error_feedback_mailto_aria_label({ layerName: ariaLayerName ?? layerName })}
	class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-sm text-accent underline underline-offset-2"
>
	<Mail size={14} aria-hidden="true" />
	<span>{m.error_feedback_mailto_label()}</span>
</a>
