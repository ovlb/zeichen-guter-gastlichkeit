import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import dotenv from 'dotenv'

dotenv.config()

const client = new Anthropic()

const SYSTEM_PROMPT = `Du bist ein Experte für Barrierefreiheit und schreibst alt-Texte für Bilder auf einer Rezept-Website. Die Bilder stammen von Rezeptkarten aus den 1970er-Jahren.

Regeln:
- Beschreibe, was auf dem Bild zu sehen ist: Gerichte, Zutaten, Tischgedeck, Dekoration.
- Schreibe auf Deutsch.
- Fasse Dich kurz und prägnant.
- Keine Floskeln wie „Das Bild zeigt” — beginne direkt mit dem Inhalt.
- Verwende ausschließlich typografische Anführungszeichen: „öffnend” und „schließend”. Niemals gerade Anführungszeichen (").
- Benutze die typografische Variante des Apostrophs (’).
- Verwende immer die typografische Variante des Bindestrichs (-) für zusammengesetzte Begriffe, z.B. „Kartoffel-Lauch-Gratin”.
- Berücksichtige den Kontext des Rezepts, wenn er für die Beschreibung des Bildes relevant ist.`

/**
 * Generates a German alt text description for a card image
 * @param {string} imagePath - Absolute path to the JPG file
 * @param {Object} [options]
 * @param {string} [options.recipeText] - Raw recipe text for additional context
 * @returns {Promise<string>} The generated alt text
 */
export async function generateAltText(imagePath, { recipeText } = {}) {
  const imageData = await fs.readFile(imagePath)
  const base64Image = imageData.toString('base64')

  let prompt = 'Schreibe einen alt-Text für dieses Bild.'
  if (recipeText) {
    prompt += `\n\nKontext — der Rezepttext auf dieser Karte:\n${recipeText}`
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
  })

  const text = response.content[0].text.trim()

  return text.replaceAll(' "', ' „').replaceAll('" ', '“ ')
}
