<script setup lang="ts">
import { capitalize } from "vue";

import { ordinalWord } from "#utils/numbers.js";
import { getEpisodes } from "~/api/episodes-api.ts";
import { getEra } from "~/api/eras-api.ts";
import { useRouteId } from "~/utils/route.ts";

import EpisodeCard from "./EpisodeCard.vue";

const eraId = useRouteId();

const { data, status, error } = await useLazyAsyncData(
	`era-${eraId}`,
	async () => {
		const [era, episodesResponse] = await Promise.all([
			getEra(eraId),
			getEpisodes({ era_id: eraId, perPage: 100 }),
		]);
		return { era, episodes: episodesResponse?.data };
	}
);
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<PageHeader to="/" label="Back to Doctors" />

		<BasicLoading :status="status" message="Loading era..." />

		<BasicAlert title="Failed to load era" :error="error" />

		<div v-if="data">
			<PageTitle :title="`The ${capitalize(ordinalWord(data.era.id))} Doctor`">
				<p class="text-lg">{{ data.era.actor }}</p>
				<p class="text-muted text-sm">
					{{ data.era.start_year }} - {{ data.era.end_year ?? "present" }}
				</p>
			</PageTitle>

			<PageGrid
				v-if="data.episodes"
				:items="data.episodes"
				:grid-cols="1"
				:sm-grid-cols="1"
				empty-message="No episodes found for this era."
			>
				<template #item="{ item: episode }">
					<EpisodeCard :episode="episode" />
				</template>
			</PageGrid>
		</div>
	</div>
</template>
