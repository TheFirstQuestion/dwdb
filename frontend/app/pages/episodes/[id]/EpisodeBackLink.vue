<script setup lang="ts">
import type { EpisodeRow } from "@/types/episodes.schema.js";
import type { SeasonRow } from "@/types/seasons.schema.js";

defineProps<{
	episode: EpisodeRow;
	season?: SeasonRow;
}>();
</script>

<template>
	<PageHeader
		v-if="season"
		:to="`/seasons/${season.id}`"
		label="Back to Season"
	/>

	<PageHeader v-else :to="`/eras/${episode.era_id}`" label="Back to Era" />
</template>
