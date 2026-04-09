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
	meaning: string,
	subtype: string,
	type: string,
	type_full: string,
	color: string,
	alt: string,
}

const matches = ref< MatchType[] >([]);

//Set the reactive state
const keyword = ref("");


//Functions
async function runSearch() {
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
		sql_where += '	AND (colors.matching LIKE "%' + keyword_clean + '%" OR colors_lang.matching LIKE "%' + keyword_clean + '%")';

	//Get the list of matches
	const sql = `
		SELECT *
		FROM colors
		INNER JOIN colors__` + locale.value + ` AS colors_lang
		ON colors.id = colors_lang.id
		WHERE 1=1
		` + sql_where + `
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


//Get a contrasting text color for the given background
function getTextColor(bgColor: string) {
	const r = parseInt("0x" + bgColor.substring(0, 2));
	const g = parseInt("0x" + bgColor.substring(2, 4));
	const b = parseInt("0x" + bgColor.substring(4, 6));

	if (((r + g + b) / 3) > 128)
		return '000000';
	else
		return 'FFFFFF';
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
		<h2>{{ t("nav.colors") }}</h2>

		<div v-if="matches.length" class="words_list">
			<div>
				<div class="meaning"><b>{{ t("search.word") }}</b></div>
				<div class="kana"><b>{{ t("search.kana") }}</b></div>
				<div class="kanji1"><b>{{ t("search.kanji") }}</b></div>
				<div class="type"><b>{{ t("search.type") }}</b></div>
				<div class="kanji2"><b>{{ t("search.kanji") }}</b></div>
			</div>

			<div v-for="row in matches" :key="row.id" :style="'background-color: #' + row.color + '; color: #' + getTextColor(row.color)">
				<div class="meaning">{{ row.meaning }}</div>
				<div class="kana">
					{{ row.kana }}
					<span class="kana" v-if="row.alt">/ {{ row.alt }}</span>
				</div>
				<div class="kanji1">{{ row.kanji }}</div>
				<div class="type">{{ t("word_type." + row.type) }} <span v-if="row.subtype">({{ row.subtype }})</span></div>
				<div class="kanji2">{{ row.kanji }}</div>
			</div>
		</div>

	</div>
</template>


<style scoped>
.words_list {
	> * {
		margin: 4px auto 4px auto;
		display: grid;
		grid-template-columns: 25% 25% 25% 25%;
		gap: 8px;

		/*line-height: 1.6;*/

		> div {
			align-items: start;
			padding-top: 8px;
			padding-bottom: 8px;
		}

		.kanji2 {
			display: none;
		}
	}
}


@media all and (max-width: 600px) {
	.words_list {
		> * {
			/* grid-template-columns: repeat(3, auto); */
			grid-template-columns: 20% auto 20%;
			grid-auto-rows: auto;

			.meaning {
				grid-column: 1;
				grid-row: span 2;
				margin-bottom: 12px;
				text-align: left;
				padding-left: 10px;
				padding-bottom: 0px;
			}

			.kanji2 {
				grid-column: 2;
				display: block;
				margin-bottom: 12px;
				padding-top: 0px;
			}

			.kana {
				grid-column: 2;
				padding-bottom: 0px;
			}

			.type {
				grid-column: 3;
				grid-row: span 2;
				text-align: right;
				padding-right: 10px;
				padding-bottom: 0px;
			}
			
			.kanji1 {
				display: none;
			}
		}
	}
}
</style>
