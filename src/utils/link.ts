export const safeHref = (value?: string): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value, 'https://scq-vue.invalid')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined
  } catch { return undefined }
}