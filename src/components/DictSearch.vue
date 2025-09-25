<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref } from 'vue';
import initSqlJs from 'sql.js';

const rows = ref([]);

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
		rows.value = values.map(row =>
			Object.fromEntries(row.map((val, i) => [columns[i], val]))
		);
	}
}


onMounted(async () => {
	console.log("onMounted");
});
</script>


<template>
	<div class="dictionary">
		<input type="text" name="keyword" placeholder="Search" v-model="keyword" @change="runSearch" />

		<table class="words_list">
			<tr v-for="row in rows" :key="row.id">
				<td>{{ row.meaning }}</td>
				<td>{{ row.kana }}</td>
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
