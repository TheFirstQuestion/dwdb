<script setup lang="ts">
import { capitalize } from "vue";
import SeasonCard from "./SeasonTableItem.vue";
import { getEra } from "~/api/eras-api.ts";
import { getSeasons } from "~/api/seasons-api.ts";
import { ordinalWord } from "~/utils/numbers.ts";
import { useRouteId } from "~/utils/route.ts";

const eraId = useRouteId();

const { data, status, error } = await useLazyAsyncData(
	`era-${eraId}`,
	async () => {
		const [era, seasonsResponse] = await Promise.all([
			getEra(eraId),
			getSeasons({ era_id: eraId }),
		]);
		return { era, seasons: seasonsResponse?.data };
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
					{{ data.era.start_year }}&ndash;{{ data.era.end_year ?? "present" }}
				</p>
			</PageTitle>

			<h2 class="text-xl font-semibold mb-4">Seasons</h2>

			<PageGrid
				v-if="data.seasons"
				:items="data.seasons"
				:grid-cols="1"
				:sm-grid-cols="1"
				empty-message="No seasons found for this era."
			>
				<template #item="{ item: season }">
					<SeasonCard :season="season" />
				</template>
			</PageGrid>
		</div>
	</div>
</template>
