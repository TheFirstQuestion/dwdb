<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { capitalize } from "vue";

import type { Episode } from "@/types/episodes.schema.js";
import type { Era } from "@/types/eras.schema.js";
import type { Season } from "@/types/seasons.schema.js";
import { ordinalWord } from "#utils/numbers.js";

const props = defineProps<{
	era?: Era;
	season?: Season;
	episode?: Episode;
}>();

const items = computed(() => {
	const crumbs: BreadcrumbItem[] = [
		{ icon: "i-lucide-house", to: "/", "aria-label": "Home" },
	];

	if (props.era) {
		crumbs.push({
			label: `The ${capitalize(ordinalWord(props.era.id))} Doctor`,
			to: `/eras/${props.era.id}`,
		});
	}
	if (props.season) {
		crumbs.push({
			label: props.season.name,
			to: `/seasons/${props.season.id}`,
		});
	}
	if (props.episode) {
		crumbs.push({
			label: props.episode.title,
			to: `/episodes/${props.episode.id}`,
		});
	}
	return crumbs;
});
</script>

<template>
	<UBreadcrumb :items="items" class="mb-4" />
</template>
