<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'tertiary';

	type Props = HTMLButtonAttributes & {
		variant?: Variant;
		class?: string;
		children: Snippet;
	};

	let { variant = 'secondary', class: className, children, ...rest }: Props = $props();

	const baseTouch =
		'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 text-base font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50';
	const baseInline =
		'inline-flex items-center font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50';

	const variants: Record<Variant, string> = {
		primary: `${baseTouch} bg-accent text-bg hover:bg-accent/90`,
		secondary: `${baseTouch} bg-transparent border border-rule-strong text-ink hover:bg-bg-elevated`,
		tertiary: `${baseInline} bg-transparent text-accent underline-offset-2 hover:underline px-0`
	};
</script>

<button class="{variants[variant]} {className ?? ''}" {...rest}>
	{@render children()}
</button>
