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
				<div class="flex items-center justify-between gap-2">
					<h3 class="font-semibold">{{ episode.title }}</h3>

					<h4
						v-if="episode.part_number != null"
						class="text-muted text-sm shrink-0"
					>
						Part {{ episode.part_number }}
					</h4>
				</div>
			</template>

			<p class="text-muted text-sm">
				{{ episode.air_date ?? "???" }}
			</p>
		</UCard>
	</NuxtLink>
</template>
