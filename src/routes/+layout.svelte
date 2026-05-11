<script lang="ts">
	import '../app.css';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import SkipLink from '$lib/components/atlas/skip-link.svelte';
	import MetaFooter from '$lib/components/atlas/meta-footer.svelte';

	let { children } = $props();
</script>

<SkipLink />

{@render children()}

<MetaFooter />

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
