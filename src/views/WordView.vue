<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
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

const displayWord = ref({});
const ready = ref(false);
const wordData = ref< MatchType >();


async function getWord(id?: number) {
	if (id == 0)
		return null;

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
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
		WHERE words.id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.bind([id]);

	if (stmt.step()) {
		wordData.value = stmt.getAsObject();
	} else {
		wordData.value = null;
	}
}


function getConjugation() {
	//TODO: Check verb form
	//TODO: Kanji and/or kana
	//... or even if it's a verb in the first place

	if (!wordData.value)
		return;

	const root = wordData.value.kana.substring(0, wordData.value.kana.length-1);
	const tenses = {
		'affirmative': {
			'present': {
				'formal': root + "ます",
				'informal': wordData.value.kana,
			},
			'past': {
				'formal': root + "ました",
				'informal': root + "た",
			},
		},
		'negative': {
			'present': {
				'formal': root + "ません",
				'informal': root + "ない",
			},
			'past': {
				'formal': root + "ませんでした",
				'informal': root + "なかった",
			},
		},
		't_form': root + 'て',
		'word': wordData.value.kana,
	}

	displayWord.value = tenses;
	return tenses;
}


//Monitor word data change to refresh results
watch(wordData, () => {
	getConjugation();
});
watch(locale, () => {
	getConjugation();
});


onMounted(async () => {
	//const urlPath = "あける-19";
	const route = useRoute();
	const urlPath = route.params.id;
	//TODO: Display error on word not found
	if (!urlPath.includes("-"))
		return;
	const wordId = urlPath.substring(urlPath.lastIndexOf("-")+1);
	if (!wordId)
		return;

	getWord(wordId);
	ready.value = true;
});
</script>


<template>
	<div>

		<h2>{{ t('nav.conjugation') }}</h2>

		<p>Infinitif / dictionnaire: {{ displayWord.word }}</p>
		<p>Forme en -te: {{ displayWord.t_form }}</p>

		<table v-if="Object.keys(displayWord).length">
			<thead>
				<tr>
					<th></th>
					<th>Affirmatif</th>
					<th>Négatif</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td rowspan="2">Non-passé</td>
					<td>{{ displayWord.affirmative.present.formal }}</td>
					<td>{{ displayWord.negative.present.formal }}</td>
				</tr>
				<tr>
					<td>{{ displayWord.affirmative.present.informal }}</td>
					<td>{{ displayWord.negative.present.informal }}</td>
				</tr>
				<tr>
					<td rowspan="2">Passé</td>
					<td>{{ displayWord.affirmative.past.formal }}</td>
					<td>{{ displayWord.negative.past.formal }}</td>
				</tr>
				<tr>
					<td>{{ displayWord.affirmative.past.informal }}</td>
					<td>{{ displayWord.negative.past.informal }}</td>
				</tr>
			</tbody>
		</table>

	</div>
</template>


<style>
</style>
