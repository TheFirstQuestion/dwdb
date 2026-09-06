<script setup lang="ts">
import type { Episode } from "@/types/episodes.schema.js";

defineProps<{
	episode: Episode;
}>();
</script>

<template>
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
</template>
