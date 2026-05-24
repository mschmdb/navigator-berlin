<!--
	Footer-Social-Icons. Monochrom via currentColor, kein Brand-Color.
	Lucide hat weder Bluesky noch LinkedIn, deshalb Inline-SVG-Marks.
-->
<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}
	let { size = 16, class: cls = '' }: Props = $props();
</script>

<div class={`flex items-center gap-3 ${cls}`}>
	<a
		href="https://bsky.app/profile/fliege.dev"
		aria-label="Matze Fliege auf Bluesky"
		target="_blank"
		rel="noopener noreferrer me"
		class="inline-flex text-ink-muted transition-colors hover:text-ink"
	>
		<svg
			width={size}
			height={size}
			viewBox="0 0 600 530"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.21 8.009 590-19.473 590 69.265c0 17.713-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.105 11.421-142.55-7.45-163.25-81.433C20.156 218.052 10 86.978 10 69.265c0-88.738 77.79-61.256 125.72-25.235z"
			/>
		</svg>
	</a>
	<a
		href="https://www.linkedin.com/in/matzeschmidbauer/"
		aria-label="Matze Schmidbauer auf LinkedIn"
		target="_blank"
		rel="noopener noreferrer me"
		class="inline-flex text-ink-muted transition-colors hover:text-ink"
	>
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
			/>
		</svg>
	</a>
</div>
