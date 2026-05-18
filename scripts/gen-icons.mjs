import sharp from 'sharp'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

for (const size of [192, 512]) {
  const svg = readFileSync(join(pub, `icon-${size}.svg`))
  await sharp(svg).resize(size, size).png().toFile(join(pub, `icon-${size}.png`))
  console.log(`icon-${size}.png generated`)
}
