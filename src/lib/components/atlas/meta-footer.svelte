<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { META_LINKS } from './internal/meta-links.js';
	type Props = { langSwitcher?: Snippet };
	let { langSwitcher }: Props = $props();
</script>

<!-- explore-Route nimmt full viewport. mt-16 würde Footer unter den Fold drücken
     und einen langen leeren Scroll-Bereich erzeugen. Auf /explore mt:0. -->
<footer
	data-route-aware-margin
	class="mt-16 border-t border-rule py-6 font-sans text-xs text-ink-subtle print:hidden [body:has([data-testid=atlas-shell])_&]:mt-0"
>
	<div class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4">
		<nav aria-label="Meta-Navigation" class="flex flex-wrap gap-y-2">
			{#each META_LINKS as link (link.href)}
				<span class="whitespace-nowrap">
					<a href={link.href} class="hover:text-accent">{link.label}</a>
					<span aria-hidden="true" class="px-2">·</span>
				</span>
			{/each}
			<span class="whitespace-nowrap">
				<a href={`mailto:${FEEDBACK_EMAIL}`} class="hover:text-accent">Kontakt</a>
			</span>
		</nav>
		{#if langSwitcher}{@render langSwitcher()}{/if}
	</div>
</footer>
