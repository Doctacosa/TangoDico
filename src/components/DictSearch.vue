<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref, watch } from 'vue';
import initSqlJs from 'sql.js';
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

type MatchType = {
	id: number,
	kana: string,
	kanji: string,
	lesson: string,
	lesson_full: string,
	meaning: string,
	subtype: string,
	type: string,
	type_full: string,
}

type FilterType = {
	key: string;
	value: string;
}

type LessonType = {
	key: string,
	value: string,
}

const matches = ref< MatchType[] >([]);
const types = ref< FilterType[] >([]);
const lessons = ref< LessonType[] >([]);
const nb_results = ref(0);

//TODO: Check if plain definition or reactive state is better
let lessons_min = 999;
let lessons_max = 0;
const results_max = 100;

const search_type = ref("");
const search_lesson_min = ref("");
const search_lesson_max = ref("");

//Set the reactive state
const keyword = ref("");


//Functions
async function runSearch(value_changed?: string) {
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

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));


	//Strip accents from the search string
	const keyword_clean = keyword.value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

	let sql_where = '';
	if (keyword_clean != "")
		sql_where += '	AND (words.matching LIKE "%' + keyword_clean + '%" OR words_lang.matching LIKE "%' + keyword_clean + '%")';
	if (search_type.value !== "")
		sql_where += '	AND type = "' + search_type.value + '"';
	if (search_lesson_min.value !== "")
		sql_where += '	AND lesson >= ' + search_lesson_min.value + '';
	if (search_lesson_max.value !== "")
		sql_where += '	AND lesson <= ' + search_lesson_max.value + '';

	//Get the amount of matches
	let sql = `
		SELECT COUNT(*)
		FROM words
		INNER JOIN words__` + locale.value + ` AS words_lang
		ON words.id = words_lang.id
		WHERE 1=1
		` + sql_where + `
	`;
	let result = db.exec(sql);
	nb_results.value = Number(result[0].values[0][0]);

	//Get the list of matches
	sql = sql.replace("COUNT(*)", "*");
	sql += `
		ORDER BY meaning COLLATE NOCASE ASC, kana COLLATE NOCASE ASC
		LIMIT ` + results_max + `
	`;
	result = db.exec(sql);

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


//Load or reload the search filters as needed
async function loadSearchFilters() {
	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	let result = db.exec(`
		SELECT DISTINCT type AS key
		FROM words
		ORDER BY type COLLATE NOCASE ASC
	`);

	if (result.length > 0) {
		types.value = [];

		//const columns = result[0].columns;
		const values = result[0].values;
		types.value.push({key: t("filter.all"), value: ""});
		for (const x in values) {
			types.value.push({key: t("word_type." + values[x][0]), value: String(values[x][0])});
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
		lessons.value = [];

		//const columns = result[0].columns;
		const values = result[0].values;
		lessons.value.push({key: t("filter.all"), value: ""});
		for (const x in values) {
			const lesson: string = String(values[x][0]);
			lessons.value.push({key: lesson, value: lesson});
			if (lessons_min > Number(lesson))
				lessons_min = Number(lesson);
			if (lessons_max < Number(lesson))
				lessons_max = Number(lesson);
		}
	}
}


//Monitor locale change to refresh results
watch(locale, () => {
	loadSearchFilters();
	runSearch();
});


onMounted(async () => {
	loadSearchFilters();
	runSearch();
});
</script>


<template>
	<div class="dictionary">
		<h2>{{ t("nav.dictionary") }}</h2>

		<div class="search_settings">
			<div class="settings">
				<InputGroup>
					<IftaLabel>
						<InputText
							name="keyword"
							type="search"
							:placeholder="t('search.placeholder')"
							v-model="keyword"
							@change="runSearch()"
							size="large"
							fluid
						/>
						<label>{{ t("search.word") }}</label>
					</IftaLabel>
					<InputGroupAddon>
						<Button label="🔍" @click="runSearch()" severity="primary" variant="text" />
					</InputGroupAddon>
				</InputGroup>
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
			<div class="results_summary">
				{{ nb_results }} {{ t("search.nb_results") }}
			</div>
		</div>

		<div v-if="matches.length" class="words_list">
			<div class="meaning"><b>{{ t("search.word") }}</b></div>
			<div class="kana"><b>{{ t("search.kana") }}</b></div>
			<div class="kanji1"><b>{{ t("search.kanji") }}</b></div>
			<div class="type"><b>{{ t("search.type") }}</b></div>
			<div class="lesson"><b>{{ t("search.lesson") }}</b></div>
			<div class="kanji2"><b>{{ t("search.kanji") }}</b></div>

			<template v-for="row in matches" :key="row.id">
				<div class="meaning">{{ row.meaning }}</div>
				<div class="kana">{{ row.kana }}</div>
				<div class="kanji1">{{ row.kanji }}</div>
				<div class="type">{{ t("word_type." + row.type) }} <span v-if="row.subtype">({{ row.subtype }})</span></div>
				<div class="lesson">{{ row.lesson }}</div>
				<div class="kanji2">{{ row.kanji }}</div>
			</template>
		</div>

		<Message v-if="nb_results > results_max" class="secondary">{{ t("search.too_many_results") }}</Message>

		<Message v-if="!matches.length" severity="info">{{ t("search.no_results") }}</Message>

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
	flex-wrap: wrap;
	margin-top: 12px;
}

.results_summary { 
	text-align: center;
	margin-top: 20px;
	font-weight: bold;
	font-size: 110%;
}

.words_list {
	margin: 20px auto 20px auto;
	display: grid;
	grid-template-columns: auto auto auto auto auto;
	gap: 8px;

	/*line-height: 1.6;*/

	> div {
		align-items: start;
	}

	.kanji2 {
		display: none;
	}

	.meaning {
		margin-bottom: 12px;
	}
}


@media all and (max-width: 600px) {
	.words_list {
		grid-template-columns: repeat(4, auto);
		grid-auto-rows: auto;

		.meaning {
			grid-column: 1;
			grid-row: span 2;
			margin-bottom: 12px;
		}

		.kanji2 {
			grid-column: 2;
			display: block;
			margin-bottom: 12px;
		}

		.kana {
			grid-column: 2;
		}

		.type {
			grid-column: 3;
			grid-row: span 2;
		}
		
		.lesson {
			grid-column: 4;
			grid-row: span 2;
		}

		.kanji1 {
			display: none;
		}
	}
}


.p-select {
	min-width: 110px;
}

.p-message {
	margin-top: 30px;
	margin-bottom: 30px;
}
</style>
