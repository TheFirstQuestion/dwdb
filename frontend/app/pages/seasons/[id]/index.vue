<script setup lang="ts">
import { getEpisodes } from "~/api/episodes-api.ts";
import { getEra } from "~/api/eras-api.ts";
import { getSeason } from "~/api/seasons-api.ts";
import BasicAlert from "~/components/basic/BasicAlert.vue";
import BasicLoading from "~/components/basic/BasicLoading.vue";
import { useRouteId } from "~/utils/route.ts";

const seasonId = useRouteId();

const { data, status, error } = await useLazyAsyncData(
	`season-${seasonId}`,
	async () => {
		const [season, episodesResponse] = await Promise.all([
			getSeason(seasonId),
			getEpisodes({ season_id: seasonId, perPage: 100 }),
		]);
		const era = await getEra(season.era_id);

		return { era, season, episodes: episodesResponse.data };
	}
);
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<PageHeader v-if="data" :era="data.era" :season="data.season" />

		<BasicLoading :message="'Loading seasons...'" :status="status" />

		<BasicAlert :error="error" :title="'Failed to load Season'" />

		<div v-if="data?.season != null">
			<PageTitle :title="data.season.name">
				<p class="text-muted text-sm">{{ data.season.year }}</p>
			</PageTitle>

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
