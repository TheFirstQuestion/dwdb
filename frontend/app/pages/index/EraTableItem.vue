<script setup lang="ts">
import type { Era } from "@/types/eras.schema.js";
import { capitalize } from "vue";

import { ordinalWord } from "~/utils/numbers.ts";

defineProps<{
	era: Era;
}>();
</script>

<template>
	<NuxtLink :to="`/eras/${era.id}`">
		<UCard
			class="h-full hover:ring-primary transition-shadow hover:ring-2 text-center"
		>
			<template #header>
				<h2 class="text-lg font-semibold">
					The {{ capitalize(ordinalWord(era.id)) }} Doctor
				</h2>
			</template>

			<p>{{ era.actor }}</p>

			<p class="text-muted text-sm">
				<span v-if="era.start_year === era.end_year">{{ era.start_year }}</span>
				<span v-else-if="era.id === 8"
					>{{ era.start_year }}, {{ era.end_year }}</span
				>
				<span v-else>{{ era.start_year }}-{{ era.end_year ?? "present" }}</span>
			</p>
		</UCard>
	</NuxtLink>
</template>
