import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import vueDevTools from 'vite-plugin-vue-devtools'

let outDir = 'C:/xampp/htdocs/tango.interordi.com/';
if (process.env.OS === 'Windows_NT') {
	//Nothing, it's the default value
} else if (process.platform === 'darwin')
	outDir = '/opt/homebrew/var/www/tango.interordi.com/';


// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		//vueDevTools(),	//Enable for devtools support
	],
	build: {
		outDir: outDir,
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		},
	},
	server: {
		port: 5175,
	}
})
