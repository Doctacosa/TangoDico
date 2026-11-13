<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
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

type WordType = {
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

const displayNumbers = ref< object >();
let sourceWord = ref< MatchType | null >();
let examplesList = ref();


async function getWord(id: string) {
	if (id == "")
		return null;

	const SQL = await initSqlJs({
		locateFile: () => `/sql-wasm.wasm`
	});

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));


	//Get the expected match
	const sql = `
		SELECT *
		FROM counters
		INNER JOIN counters__` + locale.value + ` AS counters_lang
		ON counters.id = counters_lang.id
		WHERE counters.id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.bind([id]);

	if (stmt.step()) {
		return stmt.getAsObject() as MatchType;
	} else {
		return null;
	}
}


async function getExamples(ids) {
	const SQL = await initSqlJs({
		locateFile: () => `/sql-wasm.wasm`
	});

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));


	//Get the expected match
	const sql = `
		SELECT *
		FROM words
		INNER JOIN words__` + locale.value + ` AS words_lang
		ON words.id = words_lang.id
		WHERE words.id IN (` + ids.join(',') + `)
	`;
	const stmt = db.prepare(sql);
	//TODO: Find why bind() doesn't work on this
	//stmt.bind([ids.join(',')]);

	const results = [];
	while (stmt.step()) {
		results.push(stmt.getAsObject() as WordType);
	}
	return results;
}


const bases = {
	1: 'いち',
	2: 'に',
	3: 'さん',
	4: 'よん',
	5: 'ご',
	6: 'ろく',
	7: 'なな',
	8: 'はち',
	9: 'きゅう',
	10: 'じゅう',
}


function getCounting(wordData: MatchType | null) {
	const numbers = {};

	for (let i = 1; i < 11; i++) {
		let prefix = bases[i];
		let suffix = wordData.kana;
		switch (i) {
			case 1:
				if (wordData.id == '個' || wordData.id == '冊' || wordData.id == '匹' || wordData.id == '本')
					prefix = 'いっ';
				break;
			case 6:
				if (wordData.id == '個' || wordData.id == '冊' || wordData.id == '匹' || wordData.id == '本')
					prefix = 'ろっ';
				break;
			case 8:
				if (wordData.id == '個' || wordData.id == '冊' || wordData.id == '匹' || wordData.id == '本')
					prefix = 'はっ';
				break;
			case 10:
				if (wordData.id == '個' || wordData.id == '冊' || wordData.id == '匹' || wordData.id == '本')
					prefix = 'じゅっ';
				break;
		}

		if (wordData.id == '匹' && (i == 1 || i == 6 || i == 8 || i == 10))
			suffix = 'びき';
		else if (wordData.id == '匹' && (i == 3))
			suffix = 'びき';
		if (wordData.id == '本' && (i == 1 || i == 6 || i == 8 || i == 10))
			suffix = 'ぽん';
		else if (wordData.id == '本' && (i == 3))
			suffix = 'ぼん';

		numbers[i] = {
			'prefix': prefix,
			'suffix': suffix,
			'full': prefix + suffix,
		};
	}

	return numbers;
}


watch(locale, () => {
});


onMounted(async () => {
	//const urlPath = "あける-19";
	const route = useRoute();
	const urlPath = route.params.id.toString();
	//TODO: Display error on word not found
	if (!urlPath.includes("-"))
		return;
	const wordId = urlPath.substring(urlPath.lastIndexOf("-")+1);
	if (!wordId)
		return;

	sourceWord = await getWord(wordId);
	examplesList = await getExamples(sourceWord.examples.split(','));
	displayNumbers.value = getCounting(sourceWord);
});
</script>


<template>
	<div>
		<template v-if="sourceWord">
			<h2 v-if="sourceWord.kana != sourceWord.kanji && sourceWord.kanji != null">
				{{ sourceWord.kanji }} | {{ sourceWord.kana }}
			</h2>
			<h2 v-else>
				{{ sourceWord.kana }}
			</h2>
			<h3 style="text-transform: none;">{{ sourceWord.meaning }}</h3>

		</template>


		<h3>{{ t('nav.counter') }}</h3>

		<table v-if="displayNumbers">
			<tbody>
				<tr v-for="value, key in displayNumbers">
					<td>{{ key }}</td>
					<!--td>{{ key }}{{ sourceWord.kanji }}</td-->
					<td>
						<template v-if="value.prefix != bases[key]">
							<u>{{ value.prefix }}</u>
						</template>
						<template v-else>
							{{ value.prefix }}
						</template>
						<template v-if="value.suffix != sourceWord.kana">
							<u>{{ value.suffix }}</u>
						</template>
						<template v-else>
							{{ value.suffix }}
						</template>
					</td>
				</tr>
				<tr>
					<td>How many</td>
					<td>{{ sourceWord.how_many }}</td>
				</tr>
				<tr>
					<td colspan="2">
						Exemples:
						<RouterLink
							v-for="example in examplesList"
							:to="'/word/' + example.kana + '-' + example.id"
							style="display: block"
						>
							{{ example.meaning }}
						</RouterLink>
					</td>
				</tr>
			</tbody>
		</table>

	</div>
</template>


<style>
table {
	margin-left: auto;
	margin-right: auto;

	td {
		font-size: 110%;
		padding: 4px;
	}
}
</style>
