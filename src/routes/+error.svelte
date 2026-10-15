<script lang="ts">
	import { page } from '$app/state';
	import ErrorContent from '$lib/components/atlas/error-content.svelte';
</script>

<main id="main">
	<ErrorContent status={page.status} />
</main>
