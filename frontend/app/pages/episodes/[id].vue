<script setup lang="ts">
const route = useRoute();
const episodeId = Number(route.params.id);

const { data, status, error } = await useAsyncData(
	`episode-${episodeId}`,
	async () => {
		const episode = await apiClient.getEpisode(episodeId);
		const [era, season] = await Promise.all([
			apiClient.getEra(episode.era_id),
			episode.season_id !== null
				? apiClient.getSeason(episode.season_id)
				: Promise.resolve(null),
		]);
		return { episode, era, season };
	}
);
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<NuxtLink
			v-if="data && data.season"
			:to="`/seasons/${data.season.id}`"
			class="text-primary hover:underline mb-4 inline-block"
		>
			&larr; Back to Season
		</NuxtLink>
		<NuxtLink
			v-else-if="data"
			:to="`/eras/${data.episode.era_id}`"
			class="text-primary hover:underline mb-4 inline-block"
		>
			&larr; Back to Era
		</NuxtLink>

		<p v-if="status === 'pending'" class="text-muted">
			Loading episode&hellip;
		</p>

		<UAlert
			v-else-if="error"
			color="error"
			title="Failed to load episode"
			:description="error.message"
		/>

		<div v-else-if="data">
			<div class="mb-6">
				<h1 class="text-2xl font-bold mb-2">{{ data.episode.title }}</h1>
				<p class="text-muted text-sm">
					{{ data.episode.air_date ?? "Air date unknown" }}
				</p>
				<p v-if="data.episode.part_number !== null" class="text-muted text-sm">
					Part {{ data.episode.part_number }}
				</p>
			</div>

			<UCard class="mb-4">
				<template #header>
					<h2 class="text-xl font-semibold">Doctor {{ data.era.id }}</h2>
				</template>
				<p class="text-muted text-sm">{{ data.era.actor }}</p>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-xl font-semibold">Season</h2>
				</template>
				<template v-if="data.season">
					<p class="font-semibold">{{ data.season.name }}</p>
					<p class="text-muted text-sm">{{ data.season.year }}</p>
				</template>
				<p v-else class="text-muted text-sm">No season on record.</p>
			</UCard>
		</div>
	</div>
</template>
