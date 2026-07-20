import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  // Only affects the local `vite preview` server (not the production build):
  // lets it be reached over a Tailscale HTTPS *.ts.net URL for phone testing.
  preview: {
    allowedHosts: ['.ts.net'],
  },
})
