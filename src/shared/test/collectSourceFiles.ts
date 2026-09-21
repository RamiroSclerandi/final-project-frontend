import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface SourceFile {
  file: string
  text: string
}

function listFiles(root: string, extension: string): string[] {
  if (!existsSync(root)) {
    return [] // root does not exist yet -- contract tests scan a tree that grows per PR
  }

  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      return listFiles(path, extension)
    }
    if (path.endsWith(extension) && !path.endsWith(`.test${extension}`)) {
      return [path]
    }
    return []
  })
}

/**
 * Reads every non-test file with the given extension under each root,
 * relative to the repository working directory. Used by the source-contract
 * tests (palette, layout, no-literal) to scan real components without
 * duplicating filesystem-walk logic three times.
 */
export function collectSourceFiles(
  roots: string[],
  extension: '.ts' | '.tsx',
): SourceFile[] {
  return roots.flatMap((root) =>
    listFiles(root, extension).map((file) => ({
      file,
      text: readFileSync(file, 'utf-8'),
    })),
  )
}
