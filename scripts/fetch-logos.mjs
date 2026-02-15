
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'

const downloadFile = async (url, outputPath) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
  const fileStream = fs.createWriteStream(outputPath, { flags: 'wx' })
  await finished(Readable.fromWeb(res.body).pipe(fileStream))
  console.log(`Downloaded ${outputPath}`)
}

const main = async () => {
  const logos = [
    { name: 'hubspot', url: 'https://logo.clearbit.com/hubspot.com' },
    { name: 'google-drive', url: 'https://logo.clearbit.com/drive.google.com' }, // drive.google.com might return google logo, which is fine.
    { name: 'zoom', url: 'https://logo.clearbit.com/zoom.us' }
  ]

  for (const logo of logos) {
    const outputPath = path.join('static/images/systems', `${logo.name}.png`)
    try {
      if (fs.existsSync(outputPath)) {
        console.log(`Skipping ${outputPath}, already exists.`)
        continue
      }
      await downloadFile(logo.url, outputPath)
    } catch (err) {
      console.error(`Error downloading ${logo.name}:`, err.message)
      // Fallback to google.com for drive if drive.google.com fails
      if (logo.name === 'google-drive') {
         console.log("Retrying Google Drive with google.com...")
         try {
            await downloadFile('https://logo.clearbit.com/google.com', outputPath)
         } catch (e) {
            console.error("Failed fallback:", e.message)
         }
      }
    }
  }
}

main()
