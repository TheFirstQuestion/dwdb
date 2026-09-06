<script setup lang="ts">
import EraTableItem from "./EraTableItem.vue";

const {
	data: eras,
	status: erasStatus,
	error: erasError,
} = useAsyncData(
	"eras",
	async () => {
		return apiClient.getEras();
	},
	{ lazy: true }
);
</script>

<template>
	<div class="mx-auto p-10">
		<PageTitle title="Eras" />

		<BasicLoading :status="erasStatus" message="Loading eras..." />

		<BasicAlert title="Failed to load eras!" :error="erasError" />

		<PageGrid
			v-if="eras"
			:items="eras"
			:grid-cols="1"
			:sm-grid-cols="3"
			empty-message="No eras found."
		>
			<template #item="{ item: era }">
				<EraTableItem :era="era" />
			</template>
		</PageGrid>
	</div>
</template>
