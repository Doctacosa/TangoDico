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
let lessons_min = 999;
let lessons_max = 0;

const search_type = ref("");
const search_lesson_min = ref("");
const search_lesson_max = ref("");

//Set the reactive state
const keyword = ref("");


//Functions
async function runSearch(value_changed: string) {
	//if (keyword.value == "")
	//	return;

	//Impose sane limits
	if (value_changed == 'search_lesson_min' && search_lesson_min.value > search_lesson_max.value)
		search_lesson_max.value = search_lesson_min.value;
	else if (value_changed == 'search_lesson_max' && search_lesson_min.value > search_lesson_max.value)
		search_lesson_min.value = search_lesson_max.value;

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Chemin relatif depuis public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	let sql_where = '';
	if (keyword.value != "")
		sql_where += '	AND (meaning LIKE "%' + keyword.value + '%" OR kana LIKE "%' + keyword.value + '%" OR kanji LIKE "%' + keyword.value + '%")';
	if (search_type.value !== "")
		sql_where += '	AND type = "' + search_type.value + '"';
	if (search_lesson_min.value !== "")
		sql_where += '	AND lesson >= ' + search_lesson_min.value + '';
	if (search_lesson_max.value !== "")
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
			types.value.push({key: t("word_type." + values[x][0]), value: values[x][0]});
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
			if (lessons_min > values[x][0])
				lessons_min = values[x][0];
			if (lessons_max < values[x][0])
				lessons_max = values[x][0];
		}
	}

	runSearch();
});
</script>


<template>
	<div class="dictionary">
		<h2>{{ t("nav.dictionary") }}</h2>

		<div class="search_settings">
			<div class="settings">
				<IftaLabel>
					<InputText name="keyword" :placeholder="t('search.placeholder')" v-model="keyword" @change="runSearch" size="large" fluid />
					<label>{{ t("search.word") }}</label>
				</IftaLabel>
			</div>

			<div class="subsettings">
				<IftaLabel>
					<Select
						v-model="search_type"
						:options="types"
						:placeholder="t('filter.all')"
						optionLabel="key"
						optionValue="value"
						@change="runSearch('search_type')"
					></Select>
					<label>{{ t("search.type") }}</label>
				</IftaLabel>
				<IftaLabel>
					<Select
						v-model="search_lesson_min"
						:options="lessons"
						:placeholder="t('filter.all')"
						optionLabel="key"
						optionValue="value"
						@change="runSearch('search_lesson_min')"
					></Select>
					<label>{{ t("search.lesson_min") }}</label>
				</IftaLabel>
				<IftaLabel>
					<Select
						v-model="search_lesson_max"
						:options="lessons"
						:placeholder="t('filter.all')"
						optionLabel="key"
						optionValue="value"
						@change="runSearch('search_lesson_max')"
					></Select>
					<label>{{ t("search.lesson_max") }}</label>
				</IftaLabel>
			</div>
		</div>

		<table v-if="matches.length" class="words_list">
			<tr v-for="row in matches" :key="row.id">
				<td>{{ row.meaning }}</td>
				<td>{{ row.kanji }}</td>
				<td>{{ row.kana }}</td>
				<td>{{ t("word_type." + row.type) }} <span v-if="row.subtype">({{ row.subtype }})</span></td>
				<td>{{ row.lesson }}</td>
			</tr>
		</table>

		<Message v-if="!matches.length">{{ t("search.no_results") }}</Message>

	</div>
</template>


<style scoped>
h2 {
	text-align: center;
}

.dictionary {
	text-align: left;
}

.search_settings {
	margin: 0 auto;
	max-width: 400px;
	text-align: left;
}

.subsettings {
	display: flex;
	justify-content: space-around;
	margin-top: 12px;
}

.words_list {
	margin: 20px auto 20px auto;
}

.words_list {
	/*line-height: 1.6;*/

	td {
		padding: 8px;
	}
}

.p-select {
	min-width: 110px;
}

.p-message {
	margin-top: 30px;
}
</style>
