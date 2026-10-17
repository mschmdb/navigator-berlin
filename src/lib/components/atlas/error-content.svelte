<script lang="ts">
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';

	let { status }: { status: number } = $props();

	const kind = $derived(status === 404 ? 'notFound' : status < 500 ? 'client' : 'server');
	const title = $derived(
		buildPageTitle(
			kind === 'notFound'
				? m.error_title_not_found()
				: kind === 'client'
					? m.error_title_client()
					: m.error_title_generic()
		)
	);
	const heading = $derived(
		kind === 'notFound'
			? m.error_heading_not_found()
			: kind === 'client'
				? m.error_heading_client()
				: m.error_heading_generic()
	);
	const text = $derived(
		kind === 'notFound'
			? m.error_text_not_found()
			: kind === 'client'
				? m.error_text_client()
				: m.error_text_generic()
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div data-testid="error-page" class="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16">
	<p class="text-xs text-accent">{status}</p>
	<h1 class="text-4xl font-bold text-ink">{heading}</h1>
	<p class="text-lg leading-body text-ink-muted">{text}</p>
	<nav class="flex flex-wrap gap-4 text-sm" aria-label={m.error_nav_label()}>
		<a
			href={localizedHref('/')}
			class="inline-flex min-h-(--target-min) items-center underline underline-offset-4 hover:text-accent"
		>
			{m.error_link_home()}
		</a>
		<a
			href={localizedHref('/explore')}
			class="inline-flex min-h-(--target-min) items-center underline underline-offset-4 hover:text-accent"
		>
			{m.error_link_atlas()}
		</a>
	</nav>
</div>
