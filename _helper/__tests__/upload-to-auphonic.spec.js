import test from 'ava'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getFilesFromDir,
  createProduction,
  filePathToFile,
  uploadFileToAuphonic,
  startAuphonicProduction,
} from '../upload-to-auphonic.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Mock global fetch
global.fetch = async (url) => {
  if (url === 'https://auphonic.com/api/productions.json') {
    return {
      ok: true,
      json: async () => ({ data: { uuid: 'test-uuid-123' } }),
    }
  }

  if (url.includes('upload.json')) {
    return {
      ok: true,
      json: async () => ({ status: 'ok', data: { uuid: 'test-uuid-123' } }),
    }
  }

  if (url.includes('start.json')) {
    return {
      ok: true,
      json: async () => ({
        status: 'ok',
        data: { uuid: 'test-uuid-123', status: 'processing' },
      }),
    }
  }

  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
  }
}

// Mock File constructor
global.File = class File {
  constructor(bits, name, options) {
    this.bits = bits
    this.name = name
    this.options = options
  }
}

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = {}
  }

  append(key, value) {
    this.data[key] = value
  }
}

// Setup test environment
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

test('createProduction should return a UUID', async (t) => {
  const uuid = await createProduction()
  t.is(uuid, 'test-uuid-123')
})

test('filePathToFile should convert a file path to a File object', async (t) => {
  const testFilePath = path.join(t.context.tempDir, 'test1.flac')
  const file = await filePathToFile(testFilePath)

  t.true(file instanceof File)
  t.is(file.name, 'test1.flac')
  t.is(file.options.type, 'audio/x-flac')
})

test('uploadFileToAuphonic should upload file successfully', async (t) => {
  const testFilePath = path.join(t.context.tempDir, 'test1.flac')
  const result = await uploadFileToAuphonic(testFilePath, 'test-uuid-123')

  t.is(result.status, 'ok')
  t.is(result.data.uuid, 'test-uuid-123')
})

test('startAuphonicProduction should start production', async (t) => {
  const result = await startAuphonicProduction('test-uuid-123')

  t.is(result.status, 'ok')
  t.is(result.data.status, 'processing')
})
