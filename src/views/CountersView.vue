<script setup lang="ts">
//import DictSearch from '../components/DictSearch.vue'

import { onMounted, ref, watch } from 'vue';
import initSqlJs from 'sql.js';
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

type MatchType = {
	id: number,
	kana: string,
	kanji: string,
	how_many: string,
	examples: string,
	meaning: string,
}

const matches = ref< MatchType[] >([]);


//Functions
async function runSearch() {
	const SQL = await initSqlJs({
		locateFile: () => `/sql-wasm.wasm`
	});

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));


	//Get the list of matches
	const sql = `
		SELECT *
		FROM counters
		INNER JOIN counters__` + locale.value + ` AS counters_lang
		ON counters.id = counters_lang.id
		WHERE 1=1
		ORDER BY meaning COLLATE NOCASE ASC, kana COLLATE NOCASE ASC
	`;
	const result = db.exec(sql);

	if (result.length > 0) {
		const columns = result[0].columns;
		const values = result[0].values;
		//@ts-expect-error SqlValue[] assigned to MatchType
		matches.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	} else {
		matches.value = [];
	}
}


//Monitor locale change to refresh results
watch(locale, () => {
	runSearch();
});


onMounted(async () => {
	runSearch();
});
</script>

<template>
	<div>
		<h2>{{ t("nav.counters") }}</h2>

		<p>Insert counters here</p>

		<div v-if="matches.length" class="words_list">
			<RouterLink
				:to="'/counter/' + row.kana + '-' + row.id"
				v-for="row in matches"
				:key="row.id"
				severity="secondary"
			>
				<div class="name">
					{{ row.kana }}
					|
					{{ row.kanji }}
				</div>
				<div class="meaning">
					{{ row.meaning }}
				</div>
			</RouterLink>
		</div>

	</div>
</template>


<style scoped>
.words_list {
	> * {
		display: block;
		margin: 12px auto 12px auto;
		padding: 8px;
		max-width: 400px;
		
		text-align: center;
		border: 1px solid #666;
		background-color: #222;
		border-radius: 6px;

		.name {
			font-weight: bold;
			padding-bottom: 8px;
		}

		.p-message-content {
			width: 100%;
			display: block;
		}
	}
}


@media all and (max-width: 600px) {
	.words_list {
		> * {
		}
	}
}
</style>
