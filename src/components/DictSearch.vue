<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref } from 'vue';
import initSqlJs from 'sql.js';

const matches = ref([]);
const types = ref([]);
const lessons = ref([]);

//Set the reactive state
const keyword = ref("")


//Functions
async function runSearch() {

	if (keyword.value == "")
		return;

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Chemin relatif depuis public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	const result = db.exec(`
		SELECT *
		FROM words
		LEFT JOIN words__en
		ON words.id = words__en.id
		WHERE meaning LIKE "%` + keyword.value + `%"
		ORDER BY meaning ASC, kana ASC
		LIMIT 5
	`);

	if (result.length > 0) {
		const columns = result[0].columns;
		const values = result[0].values;
		matches.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	}
}


onMounted(async () => {
	console.log("onMounted");

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
	});

	const response = await fetch('/jpdict.db');	//Chemin relatif depuis public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));

	let result = db.exec(`
		SELECT DISTINCT TRIM(type) AS type
		FROM words
		ORDER BY type ASC
	`);

	if (result.length > 0) {
		const columns = result[0].columns;
		const values = result[0].values;
		types.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	}

	result = db.exec(`
		SELECT DISTINCT TRIM(lesson) AS lesson
		FROM words
		ORDER BY lesson ASC
	`);

	if (result.length > 0) {
		const columns = result[0].columns;
		const values = result[0].values;
		lessons.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	}
});
</script>


<template>
	<div class="dictionary">
		<input type="text" name="keyword" placeholder="Search" v-model="keyword" @change="runSearch" />
		<br />
		<select>
			<option key="">All</option>
			<option v-for="row in types" :key="row.type">{{ row.type }}</option>
		</select>
		<select>
			<option key="">All</option>
			<option v-for="row in lessons" :key="row.type">{{ row.lesson }}</option>
		</select>

		<table class="words_list">
			<tr v-for="row in matches" :key="row.id">
				<td>{{ row.meaning }}</td>
				<td>{{ row.kanji }}</td>
				<td>{{ row.kana }}</td>
				<td>{{ row.type }}</td>
				<td>{{ row.lesson }}</td>
			</tr>
		</table>

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
