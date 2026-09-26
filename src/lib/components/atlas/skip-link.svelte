<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	type Props = { label?: string; href?: string };
	let { label = m.shell_skip_link_label(), href = '#main' }: Props = $props();
</script>

<a
	{href}
	class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:bg-bg-elevated focus-visible:px-4 focus-visible:py-2 focus-visible:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
>
	{label}
</a>
