// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

function buildGroupsManifest() {
  const publicDir = join(process.cwd(), 'public')
  if (!existsSync(publicDir)) return
  const files = readdirSync(publicDir).filter((f) => f.endsWith('.json') && f !== 'groups-manifest.json')
  const groups: { id: string; file: string }[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(join(publicDir, file), 'utf-8')
      const json = JSON.parse(raw)
      const name = (json.group || file.replace(/\.json$/, '')).trim()
      groups.push({ id: name, file })
    } catch (e) {
      console.warn(`[groups-manifest] skip ${file}:`, e)
    }
  }
  writeFileSync(join(publicDir, 'groups-manifest.json'), JSON.stringify({ groups }, null, 2))
  console.log(`[groups-manifest] generated ${groups.length} group(s) into public/`)
}

export default defineNuxtConfig({
  hooks: {
    'build:before': () => buildGroupsManifest(),
    'nitro:init': () => buildGroupsManifest(),
  },
  compatibilityDate: '2025-07-15',
  compatibilityVersion: 3,
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  colorMode: {
    preference: 'system',
    fallback: 'light',
  },
  app: {
    baseURL: process.env.GITHUB_PAGES_BASE || '/',
    head: {
      title: 'AsuSchedule — Расписание МАДИ',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Расписание занятий МАДИ. Числитель и знаменатель по неделям.' }
      ]
    }
  },
  nitro: {
    prerender: {
      failOnError: false,
      crawlLinks: false,
    },
  },
})
