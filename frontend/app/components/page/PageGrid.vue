<script setup lang="ts" generic="T extends { id: number | string }">
defineProps<{
	items: T[];
	gridCols: number;
	smGridCols: number;
	emptyMessage: string;
}>();
</script>

<template>
	<p v-if="items.length === 0" class="text-muted">{{ emptyMessage }}</p>

	<ul v-else class="grid gap-4">
		<li v-for="item in items" :key="item.id">
			<slot name="item" :item="item" />
		</li>
	</ul>
</template>

<style scoped>
ul {
	grid-template-columns: repeat(v-bind(gridCols), minmax(0, 1fr));
}

@media (min-width: 640px) {
	ul {
		grid-template-columns: repeat(v-bind(smGridCols), minmax(0, 1fr));
	}
}
</style>
