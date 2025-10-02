<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref } from 'vue';
import initSqlJs from 'sql.js';
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const matches = ref([]);
const types = ref([]);
const lessons = ref([]);

//TODO: Check if plain definition or reactive state is better
let lessons_min = 0;
let lessons_max = 99;

const search_type = ref("");
const search_lesson_min = ref("");
const search_lesson_max = ref("");

//Set the reactive state
const keyword = ref("");


//Functions
async function runSearch() {
	//if (keyword.value == "")
	//	return;

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Chemin relatif depuis public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	let sql_where = '';
	if (keyword.value != "")
		sql_where += '	AND meaning LIKE "%' + keyword.value + '%" OR kana LIKE "%' + keyword.value + '%" OR kanji LIKE "%' + keyword.value + '%"';
	if (search_type.value != "")
		sql_where += '	AND type = "' + search_type.value + '"';
	if (search_lesson_min.value != "")
		sql_where += '	AND lesson >= ' + search_lesson_min.value + '';
	if (search_lesson_max.value != "")
		sql_where += '	AND lesson <= ' + search_lesson_max.value + '';

	const sql = `
		SELECT *
		FROM words
		INNER JOIN words__fr AS words_lang
		ON words.id = words_lang.id
		WHERE 1=1
		` + sql_where + `
		ORDER BY meaning COLLATE NOCASE ASC, kana COLLATE NOCASE ASC
		LIMIT 100
	`;
	const result = db.exec(sql);

	if (result.length > 0) {
		const columns = result[0].columns;
		const values = result[0].values;
		matches.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	} else {
		matches.value = [];
	}
}


onMounted(async () => {
	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Chemin relatif depuis public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	let result = db.exec(`
		SELECT DISTINCT type AS key
		FROM words
		ORDER BY type COLLATE NOCASE ASC
	`);

	if (result.length > 0) {
		//const columns = result[0].columns;
		const values = result[0].values;
		types.value.push({key: t("filter.all"), value: ""});
		for (const x in values) {
			types.value.push({key: values[x][0], value: values[x][0]});
		}
		/*
		types.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
		*/
	}

	result = db.exec(`
		SELECT DISTINCT lesson AS key
		FROM words
		ORDER BY lesson COLLATE NOCASE ASC
	`);

	if (result.length > 0) {
		//const columns = result[0].columns;
		const values = result[0].values;
		lessons.value.push({key: t("filter.all"), value: ""});
		for (const x in values) {
			lessons.value.push({key: values[x][0], value: values[x][0]});
		}
	}

	//TODO: min(), max() based on actual data
	lessons_min = 0;
	lessons_max = 23;
});
</script>


<template>
	<div class="dictionary">
		<InputText name="keyword" :placeholder="t('search.placeholder')" v-model="keyword" @change="runSearch" size="large" />
		<br />
		<Select v-model="search_type" :options="types" optionLabel="key" optionValue="value" @change="runSearch">
		</Select>
		<Select v-model="search_lesson_min" :options="lessons" optionLabel="key" optionValue="value" @change="runSearch">
		</Select>
		<Select v-model="search_lesson_max" :options="lessons" optionLabel="key" optionValue="value" @change="runSearch">
		</Select>

		<table v-if="matches.length" class="words_list">
			<tr v-for="row in matches" :key="row.id">
				<td>{{ row.meaning }}</td>
				<td>{{ row.kanji }}</td>
				<td>{{ row.kana }}</td>
				<td>{{ row.type }} <span v-if="row.subtype">({{ row.subtype }})</span></td>
				<td>{{ row.lesson }}</td>
			</tr>
		</table>

		<div v-if="!matches.length" class="alert-info">{{ t("search.no_results") }}</div>

	</div>
</template>


<style scoped>
.words_list {
	margin: 20px auto 20px auto;
}

.words_list {
	/*line-height: 1.6;*/

	td {
		padding: 8px;
	}
}
</style>
