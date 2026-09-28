<script setup lang="ts">
import { capitalize } from "vue";
import EpisodeBackLink from "./EpisodeBackLink.vue";
import { getEpisode } from "~/api/episodes-api.ts";
import { getEra } from "~/api/eras-api.ts";
import { getSeason } from "~/api/seasons-api.ts";
import { ordinalWord } from "#utils/numbers.js";
import { useRouteId } from "~/utils/route.ts";

const episodeId = useRouteId();

const { data, status, error } = await useLazyAsyncData(
	`episode-${episodeId}`,
	async () => {
		const episode = await getEpisode(episodeId);

		const [era, season] = await Promise.all([
			getEra(episode.era_id),
			episode.season_id !== undefined
				? getSeason(episode.season_id)
				: undefined,
		]);
		return { episode, era, season };
	}
);
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<EpisodeBackLink
			v-if="data"
			:episode="data.episode"
			:season="data.season"
		/>

		<BasicLoading :status="status" message="Loading episode..." />

		<BasicAlert title="Failed to load episode" :error="error" />

		<div v-if="data">
			<PageTitle :title="data.episode.title">
				<p class="text-muted text-sm">
					{{ data.episode.air_date ?? "Air date unknown" }}
				</p>
				<p v-if="data.episode.part_number !== null" class="text-muted text-sm">
					Part {{ data.episode.part_number }}
				</p>
			</PageTitle>

			<UCard class="mb-4">
				<template #header>
					<h2 class="text-xl font-semibold">
						The {{ capitalize(ordinalWord(data.era.id)) }} Doctor
					</h2>
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
