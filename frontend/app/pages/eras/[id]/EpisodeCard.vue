<script setup lang="ts">
import type { Episode } from "@/types/episodes.schema";
import { parseDate } from "#utils/dates.ts";

const props = defineProps<{
	episode: Episode;
}>();

const airDate = parseDate(props.episode.air_date);
</script>

<template>
	<NuxtLink :to="`/episodes/${episode.id}`">
		<UCard class="hover:ring-primary transition-shadow hover:ring-2">
			<template #header>
				<div class="flex items-center justify-between gap-2">
					<h3 class="font-semibold">{{ episode.title }}</h3>

					<h4 v-if="airDate" class="text-muted text-sm shrink-0">
						{{ airDate?.getUTCFullYear() }}
					</h4>
				</div>
			</template>

			<p class="text-muted text-sm">
				{{ episode.air_date ?? "???" }}
			</p>
		</UCard>
	</NuxtLink>
</template>
