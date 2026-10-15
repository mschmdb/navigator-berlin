<script lang="ts">
	import { page } from '$app/state';
	import ErrorContent from '$lib/components/atlas/error-content.svelte';
</script>

<ErrorContent status={page.status} />
