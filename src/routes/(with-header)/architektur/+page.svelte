<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
</script>

<SeoHead
	title="Architektur · navigator.berlin"
	description="Technische Architektur und EU-FOSS-Stack hinter navigator.berlin: SvelteKit, Postgres-17, Coolify, Hetzner Falkenstein."
	pathname={page.url.pathname}
	origin={page.url.origin}
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-3xl">Architektur</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">
		navigator.berlin ist mit einem EU-FOSS-Stack gebaut: alle Production-Komponenten sind
		Open-Source und werden in der EU betrieben. Kein US-Cloud-Anbieter im Produktiv-Pfad,
		keine proprietären Tracking-Services, kein Cookie-Banner notwendig.
	</p>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Hosting</h2>
		<dl class="mt-4 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Server</dt>
				<dd>Hetzner Cloud CPX22 (AMD Genoa, 2 vCPU, 4 GB RAM, 80 GB SSD)</dd>
			</div>
			<div>
				<dt class="font-medium">Standort</dt>
				<dd>Falkenstein, Sachsen, Deutschland</dd>
			</div>
			<div>
				<dt class="font-medium">Betriebssystem</dt>
				<dd>Ubuntu 24.04 LTS</dd>
			</div>
			<div>
				<dt class="font-medium">Domain</dt>
				<dd>navigator.berlin (Registrar: INWX, Schönefeld DE)</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Deployment + Reverse-Proxy</h2>
		<dl class="mt-4 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">PaaS</dt>
				<dd>
					<a class="text-accent underline" href="https://coolify.io/" rel="noopener noreferrer" target="_blank"
						>Coolify</a
					>
					(Open-Source, Self-Hosted, GPL-3.0)
				</dd>
			</div>
			<div>
				<dt class="font-medium">Reverse-Proxy</dt>
				<dd>
					<a class="text-accent underline" href="https://traefik.io/" rel="noopener noreferrer" target="_blank"
						>Traefik v3</a
					>
					mit automatischem Let's-Encrypt-TLS (HTTP-Challenge)
				</dd>
			</div>
			<div>
				<dt class="font-medium">Container-Runtime</dt>
				<dd>Docker mit Compose-Stack</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Anwendung</h2>
		<dl class="mt-4 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Frontend / SSR</dt>
				<dd>
					<a class="text-accent underline" href="https://svelte.dev/" rel="noopener noreferrer" target="_blank"
						>Svelte 5</a
					>
					mit
					<a class="text-accent underline" href="https://kit.svelte.dev/" rel="noopener noreferrer" target="_blank"
						>SvelteKit 2</a
					>
					(Node-Adapter, prerender-first)
				</dd>
			</div>
			<div>
				<dt class="font-medium">Karte</dt>
				<dd>
					<a class="text-accent underline" href="https://maplibre.org/" rel="noopener noreferrer" target="_blank"
						>MapLibre GL JS</a
					>
					+ Vector-Tiles von
					<a class="text-accent underline" href="https://openfreemap.org/" rel="noopener noreferrer" target="_blank"
						>OpenFreeMap</a
					>
				</dd>
			</div>
			<div>
				<dt class="font-medium">Styling</dt>
				<dd>Tailwind CSS v4, IBM Plex Font-Familie (OFL-Lizenz)</dd>
			</div>
			<div>
				<dt class="font-medium">Charts</dt>
				<dd>
					<a class="text-accent underline" href="https://layerchart.com/" rel="noopener noreferrer" target="_blank"
						>LayerChart</a
					>
					+ D3
				</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Daten + Aggregat-Schicht</h2>
		<dl class="mt-4 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Datenbank</dt>
				<dd>PostgreSQL 17 (alpine), nur auf internem Docker-Netzwerk erreichbar</dd>
			</div>
			<div>
				<dt class="font-medium">ORM / Migrations</dt>
				<dd>
					<a class="text-accent underline" href="https://orm.drizzle.team/" rel="noopener noreferrer" target="_blank"
						>Drizzle ORM</a
					>
				</dd>
			</div>
			<div>
				<dt class="font-medium">Geocoding</dt>
				<dd>
					<a class="text-accent underline" href="https://nominatim.openstreetmap.org/" rel="noopener noreferrer" target="_blank"
						>Nominatim</a
					>
					(OpenStreetMap Foundation, EU)
				</dd>
			</div>
			<div>
				<dt class="font-medium">Daten-Quellen</dt>
				<dd>
					<a class="text-accent underline" href="https://daten.berlin.de/" rel="noopener noreferrer" target="_blank"
						>ODIS Berlin</a
					>, FIS-Broker (Berlin), Amt für Statistik Berlin-Brandenburg, DWD,
					OpenStreetMap. Vollständige Liste siehe
					<a class="text-accent underline" href="/lizenzen">Lizenzen</a>.
				</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Sicherheit</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>TLS 1.2/1.3 erzwungen, automatische Zertifikats-Erneuerung via Let's Encrypt</li>
			<li>HTTP-Security-Headers: HSTS (2 Jahre, preload-ready), X-Frame-DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy</li>
			<li>HTTP/2 + HTTP/3 aktiv</li>
			<li>Hetzner-Cloud-Firewall: nur Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) eingehend</li>
			<li>SSH gehärtet: nur Key-Auth, kein Passwort-Login, fail2ban aktiv</li>
			<li>Postgres ohne öffentlichen Port, nur Internal-Docker-Network</li>
			<li>Hetzner-Layer-3/4-DDoS-Schutz aktiv (kostenlos, Default)</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Build + Deployment</h2>
		<dl class="mt-4 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Build-Pipeline</dt>
				<dd>Docker Multi-Stage (Node 22 Alpine), pnpm Workspace, vite build mit SvelteKit-Prerender</dd>
			</div>
			<div>
				<dt class="font-medium">Aggregat-Step</dt>
				<dd>
					tsx-Scripts (data:aggregate, data:aggregate-scores, data:faq, og:images) laufen
					im prebuild-Hook gegen die Production-Postgres und befüllen kiez_score, bezirk_score,
					faq_qna sowie 198 vorgenerierte OG-Card-PNGs.
				</dd>
			</div>
			<div>
				<dt class="font-medium">Repository</dt>
				<dd>
					<a
						class="text-accent underline"
						href="https://github.com/mschmdb/navigator-berlin"
						rel="noopener noreferrer"
						target="_blank"
					>github.com/mschmdb/navigator-berlin</a
					>
					(privat während Phase 1, Open-Source-Release vor Hard-Launch geplant)
				</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Backup</h2>
		<p class="mt-3 leading-relaxed">
			Wöchentlich (Sonntags 04:00 UTC) wird ein Postgres-Dump gezogen und auf einen zweiten
			Hetzner-Server (ebenfalls EU, separate Region) gespiegelt. 4-Wochen-Retention. Da die
			Daten aus offenen Quellen reproduzierbar sind, ist das Backup Bequemlichkeit, nicht
			Existenz-Notwendigkeit.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Was bewusst NICHT verwendet wird</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>Kein Cloudflare, kein AWS, kein GCP, kein Azure</li>
			<li>Kein Google Analytics, kein Facebook Pixel</li>
			<li>Keine Drittanbieter-Embeds (kein YouTube, kein Twitter-Widget, kein Hubspot)</li>
			<li>Keine Tracking-Cookies, kein Cookie-Banner</li>
			<li>Keine User-Accounts, keine Login-Funktion, keine Newsletter-Sammlung</li>
		</ul>
	</section>
</main>
