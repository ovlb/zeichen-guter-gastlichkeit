import test from 'ava'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { filePathToFile, getFilesFromDir } from '../upload-to-auphonic.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Setup test environment
/**
 * @param {import('ava').ExecutionContext} t
 */
test.before(async (t) => {
  process.env.AUPHONIC_API_KEY = 'test-key'
  process.env.AUPHONIC_PRESET_ID = 'test-preset'

  // Create temp test directory and files
  t.context.tempDir = path.join(__dirname, 'test-audio')
  await fs.mkdir(t.context.tempDir, { recursive: true })
  await fs.writeFile(
    path.join(t.context.tempDir, 'test1.flac'),
    'test audio content',
  )
  await fs.writeFile(
    path.join(t.context.tempDir, 'test2.flac'),
    'test audio content 2',
  )
  await fs.writeFile(
    path.join(t.context.tempDir, 'test.txt'),
    'not an audio file',
  )
})

// Clean up after tests
test.after.always(async (t) => {
  try {
    await fs.rm(t.context.tempDir, { recursive: true })
  } catch (err) {
    console.error('Failed to clean up test directory:', err)
  }
})

test('getFilesFromDir should return only flac files', async (t) => {
  const files = await getFilesFromDir(t.context.tempDir)
  t.is(files.length, 2)
  t.true(files.every((file) => file.endsWith('.flac')))
  t.true(files.some((file) => file.includes('test1.flac')))
  t.true(files.some((file) => file.includes('test2.flac')))
})

test('getFilesFromDir should throw on invalid directory', async (t) => {
  await t.throwsAsync(async () => {
    await getFilesFromDir('/path/does/not/exist')
  })
})

test('filePathToFile should convert a file path to a File object', async (t) => {
  const testFilePath = path.join(t.context.tempDir, 'test1.flac')
  const file = await filePathToFile(testFilePath)

  t.true(file instanceof File)
  t.is(file.name, 'test1.flac')
})
