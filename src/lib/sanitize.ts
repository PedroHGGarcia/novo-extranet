export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''
  try {
    const doc = new DOMParser().parseFromString(dirty, 'text/html')
    const dangerous = doc.querySelectorAll(
      'script, iframe, object, embed, form, input, textarea, button, link, meta, base, style',
    )
    dangerous.forEach((el) => el.remove())
    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name)
        } else if (
          (attr.name === 'href' || attr.name === 'src') &&
          (attr.value.toLowerCase().trim().startsWith('javascript:') ||
            attr.value.toLowerCase().trim().startsWith('data:text/html'))
        ) {
          el.removeAttribute(attr.name)
        }
      })
    })
    return doc.body.innerHTML
  } catch {
    return ''
  }
}
