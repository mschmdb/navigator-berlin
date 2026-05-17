<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { META_LINKS } from './internal/meta-links.js';
	type Props = { langSwitcher?: Snippet };
	let { langSwitcher }: Props = $props();
</script>

<footer
	class="mt-16 border-t border-rule py-6 font-sans text-xs text-ink-subtle print:hidden"
>
	<div class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4">
		<nav aria-label="Meta-Navigation" class="flex flex-wrap gap-x-4 gap-y-2">
			{#each META_LINKS as link, i (link.href)}
				{#if i > 0}<span aria-hidden="true">·</span>{/if}
				<a href={link.href} class="hover:text-accent">{link.label}</a>
			{/each}
			<span aria-hidden="true">·</span>
			<a href={`mailto:${FEEDBACK_EMAIL}`} class="hover:text-accent">Kontakt</a>
		</nav>
		{#if langSwitcher}{@render langSwitcher()}{/if}
	</div>
</footer>
