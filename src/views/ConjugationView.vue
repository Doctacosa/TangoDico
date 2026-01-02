<script setup lang="ts">
import WordLine from '../components/WordLine.vue'
</script>

<template>
	<div>
		<table border="1">
			<thead>
				<tr>
					<th></th>
					<th>Long form</th>
					<th>Present aff.</th>
					<th>Present neg.</th>
					<th>Past aff.</th>
					<th>Past Neg.</th>
					<th>T-form</th>
				</tr>
			</thead>
			<tbody>
				<WordLine :word-id="219" :label="'ru-form'" />
				<WordLine :word-id="414" :label="'ru-form'" />
				<WordLine :word-id="746" :label="'ru-form'" />
				<WordLine :word-id="235" :label="'ru-form'" />

				<WordLine :word-id="332" :label="'u-form'" />
				<WordLine :word-id="1379" :label="'u-form'" />
				<WordLine :word-id="90" :label="'u-form'" />
				<WordLine :word-id="312" :label="'u-form'" />
				<WordLine :word-id="66" :label="'u-form'" />
				<WordLine :word-id="1289" :label="'u-form'" />

				<WordLine :word-id="524" :label="'irr'" />
				<WordLine :word-id="880" :label="'irr'" />

				<WordLine :word-id="976" :label="'i-adj'" />
				<WordLine :word-id="1760" :label="'i-adj'" />
				<WordLine :word-id="78" :label="'i-adj'" />

				<WordLine :word-id="840" :label="'na-adj'" />
				<WordLine :word-id="1480" :label="'na-adj'" />

				<WordLine :word-id="347" :label="'noun'" />
			</tbody>
		</table>
	</div>
</template>


<style>
table th, table td {
	padding: 5px;
}
</style>
