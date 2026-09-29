const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'template', 'link', 'meta', 'base'])
export function safeContentUrl(value: string, base = 'https://localhost/'): string | undefined {
    if (!value.trim()) return undefined
    try {
        const url = new URL(value, base)
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
    } catch { return undefined }
}
export function parseNoticeBody(html: string): HTMLElement {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    for (const tag of DROP) doc.querySelectorAll(tag).forEach((node) => node.remove())
    return doc.body
}
export function noticeSummary(html: string): string {
    return parseNoticeBody(html).textContent?.replace(/\s+/g, ' ').trim().slice(0, 120) ?? ''
}
