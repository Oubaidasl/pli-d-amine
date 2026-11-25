import { readdir } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { defineConfig } from 'vite'

const portraits = 'virtual:player-portraits'
const resolvedPortraits = '\0' + portraits

let portraitDirectory

export default defineConfig({
  plugins: [{
    name: 'player-portrait-filenames',
    configResolved(config) {
      portraitDirectory = resolve(config.publicDir, 'assets/profiles')
    },
    resolveId(id) {
      if (id === portraits) return resolvedPortraits
    },
    async load(id) {
      if (id !== resolvedPortraits) return
      let entries
      try {
        entries = await readdir(portraitDirectory, { withFileTypes: true })
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        entries = []
      }
      const filenames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()
      return 'export default ' + JSON.stringify(filenames)
    },
    configureServer(server) {
      const refreshPortraits = (file) => {
        const local = relative(portraitDirectory, file)
        if (!local || local.startsWith('..') || isAbsolute(local)) return
        const module = server.moduleGraph.getModuleById(resolvedPortraits)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refreshPortraits).on('unlink', refreshPortraits)
    },
  }],
})
