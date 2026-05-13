<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	type Props = { langSwitcher?: Snippet };
	let { langSwitcher }: Props = $props();
</script>

<footer
	class="mt-16 border-t border-rule py-6 font-sans text-xs text-ink-subtle"
>
	<div class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4">
		<nav aria-label="Meta-Navigation" class="flex flex-wrap gap-x-4 gap-y-2">
			<a href="/impressum" class="hover:text-accent">Impressum</a>
			<span aria-hidden="true">·</span>
			<a href="/datenschutz" class="hover:text-accent">Datenschutz</a>
			<span aria-hidden="true">·</span>
			<a href="/lizenzen" class="hover:text-accent">Lizenzen</a>
			<span aria-hidden="true">·</span>
			<a href="/architektur" class="hover:text-accent">Architektur</a>
			<span aria-hidden="true">·</span>
			<a href={`mailto:${FEEDBACK_EMAIL}`} class="hover:text-accent">Kontakt</a>
		</nav>
		{#if langSwitcher}{@render langSwitcher()}{/if}
	</div>
	<p class="mx-auto mt-3 max-w-[1440px] px-4">
		BFSG-konform, WCAG 2.2 AA komplett, AAA wo möglich.
	</p>
</footer>
