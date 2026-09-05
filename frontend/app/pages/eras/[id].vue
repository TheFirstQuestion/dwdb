<script setup lang="ts">
const route = useRoute();
const eraId = Number(route.params.id);

const { data, status, error } = await useAsyncData(`era-${eraId}`, async () => {
	const [era, seasonsResponse] = await Promise.all([
		apiClient.getEra(eraId),
		apiClient.getSeasons({ eraId }),
	]);
	return { era, seasons: seasonsResponse.data };
});
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<NuxtLink to="/" class="text-primary hover:underline mb-4 inline-block">
			&larr; Back to Doctors
		</NuxtLink>

		<p v-if="status === 'pending'" class="text-muted">Loading era&hellip;</p>

		<UAlert
			v-else-if="error"
			color="error"
			title="Failed to load era"
			:description="error.message"
		/>

		<div v-else-if="data">
			<div class="mb-6">
				<h1 class="text-2xl font-bold mb-2">Doctor {{ data.era.id }}</h1>
				<p class="text-lg">{{ data.era.actor }}</p>
				<p class="text-muted text-sm">
					{{ data.era.start_year }}&ndash;{{ data.era.end_year ?? "present" }}
				</p>
			</div>

			<h2 class="text-xl font-semibold mb-4">Seasons</h2>

			<p v-if="data.seasons.length === 0" class="text-muted">
				No seasons found for this era.
			</p>

			<ul v-else class="space-y-2">
				<li v-for="season in data.seasons" :key="season.id">
					<NuxtLink :to="`/seasons/${season.id}`">
						<UCard class="hover:ring-primary transition-shadow hover:ring-2">
							<template #header>
								<h3 class="font-semibold">{{ season.name }}</h3>
							</template>
							<p class="text-muted text-sm">{{ season.year }}</p>
						</UCard>
					</NuxtLink>
				</li>
			</ul>
		</div>
	</div>
</template>
