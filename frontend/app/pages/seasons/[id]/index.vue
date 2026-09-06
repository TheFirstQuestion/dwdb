<script setup lang="ts">
import BasicLoading from "~/components/basic/BasicLoading.vue";
import EpisodeCard from "./EpisodeCard.vue";
import BasicAlert from "~/components/basic/BasicAlert.vue";

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
		<PageHeader
			v-if="data"
			:to="`/eras/${data.season.era_id}`"
			label="Back to Era"
		/>

		<BasicLoading :message="'Loading seasons...'" :status="status" />

		<BasicAlert :error="error" :title="'Failed to load Season'" />

		<div v-if="data != null">
			<PageTitle :title="data.season.name">
				<p class="text-muted text-sm">{{ data.season.year }}</p>
			</PageTitle>

			<h2 class="text-xl font-semibold mb-4">Episodes</h2>

			<PageGrid
				:items="data.episodes"
				:grid-cols="1"
				:sm-grid-cols="1"
				empty-message="No episodes found for this season."
			>
				<template #item="{ item: episode }">
					<EpisodeCard :episode="episode" />
				</template>
			</PageGrid>
		</div>
	</div>
</template>
