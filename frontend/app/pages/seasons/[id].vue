<script setup lang="ts">
const route = useRoute();
const seasonId = Number(route.params.id);

const { data, status, error } = await useAsyncData(
	`season-${seasonId}`,
	async () => {
		const [season, episodesResponse] = await Promise.all([
			apiClient.getSeason(seasonId),
			apiClient.getEpisodes({ seasonId, perPage: 100 }),
		]);
		return { season, episodes: episodesResponse.data };
	}
);
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<NuxtLink
			v-if="data"
			:to="`/eras/${data.season.era_id}`"
			class="text-primary hover:underline mb-4 inline-block"
		>
			&larr; Back to Era
		</NuxtLink>

		<p v-if="status === 'pending'" class="text-muted">Loading season&hellip;</p>

		<UAlert
			v-else-if="error"
			color="error"
			title="Failed to load season"
			:description="error.message"
		/>

		<div v-else-if="data">
			<div class="mb-6">
				<h1 class="text-2xl font-bold mb-2">{{ data.season.name }}</h1>
				<p class="text-muted text-sm">{{ data.season.year }}</p>
			</div>

			<h2 class="text-xl font-semibold mb-4">Episodes</h2>

			<p v-if="data.episodes.length === 0" class="text-muted">
				No episodes found for this season.
			</p>

			<ul v-else class="space-y-2">
				<li v-for="episode in data.episodes" :key="episode.id">
					<NuxtLink :to="`/episodes/${episode.id}`">
						<UCard class="hover:ring-primary transition-shadow hover:ring-2">
							<template #header>
								<h3 class="font-semibold">{{ episode.title }}</h3>
							</template>
							<p class="text-muted text-sm">
								{{ episode.air_date ?? "Air date unknown" }}
							</p>
							<p v-if="episode.part_number !== null" class="text-muted text-sm">
								Part {{ episode.part_number }}
							</p>
						</UCard>
					</NuxtLink>
				</li>
			</ul>
		</div>
	</div>
</template>
