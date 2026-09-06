<script setup lang="ts">
import type { SeasonRow } from "@/types/seasons.schema.js";

defineProps<{
	season: SeasonRow;
}>();
</script>

<template>
	<NuxtLink :to="`/seasons/${season.id}`">
		<UCard class="hover:ring-primary transition-shadow hover:ring-2">
			<template #header>
				<h3 class="font-semibold">{{ season.name }}</h3>
			</template>
			<p class="text-muted text-sm">{{ season.year }}</p>
		</UCard>
	</NuxtLink>
</template>
