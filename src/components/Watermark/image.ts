const aborted = () => new DOMException('Watermark image loading was cancelled.', 'AbortError')

const readDataUrl = (blob: Blob, signal: AbortSignal) => new Promise<string>((resolve, reject) => {
  if (signal.aborted) { reject(aborted()); return }
  const reader = new FileReader()
  const cleanup = () => { signal.removeEventListener('abort', cancel); reader.onload = null; reader.onerror = null }
  const cancel = () => { cleanup(); reader.abort(); reject(aborted()) }
  reader.onload = () => {
    cleanup()
    if (typeof reader.result !== 'string') reject(new TypeError('[scq-vue] Watermark image data could not be read.'))
    else resolve(reader.result)
  }
  reader.onerror = () => { cleanup(); reject(reader.error ?? new Error('[scq-vue] Watermark image reading failed.')) }
  signal.addEventListener('abort', cancel, { once: true })
  reader.readAsDataURL(blob)
})

export const loadWatermarkImage = async (source: string, signal: AbortSignal): Promise<string> => {
  let data = source
  if (!/^data:image\/[a-z0-9.+-]+[;,]/i.test(source)) {
    const response = await fetch(source, { signal })
    if (!response.ok) throw new Error(`[scq-vue] Watermark image request failed (${response.status}).`)
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) throw new TypeError('[scq-vue] Watermark image must have an image MIME type.')
    data = await readDataUrl(blob, signal)
  }
  return new Promise<string>((resolve, reject) => {
    if (signal.aborted) { reject(aborted()); return }
    const image = new Image()
    const cleanup = () => { signal.removeEventListener('abort', cancel); image.onload = null; image.onerror = null }
    const cancel = () => { cleanup(); image.removeAttribute('src'); reject(aborted()) }
    image.onload = () => { cleanup(); resolve(data) }
    image.onerror = () => { cleanup(); reject(new Error('[scq-vue] Watermark image could not be decoded.')) }
    signal.addEventListener('abort', cancel, { once: true })
    image.src = data
  })
}
