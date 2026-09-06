<script setup lang="ts">
import type { Episode } from "@/types/episodes.schema.js";
import type { Season } from "@/types/seasons.schema.js";

defineProps<{
	episode: Episode;
	season?: Season;
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
