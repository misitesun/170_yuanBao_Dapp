import { createElement, type ReactNode } from 'react'
import { parseNoticeBody, safeContentUrl } from './html.ts'

const ALLOWED = new Set(['p', 'div', 'span', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'hr', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'])

/** Render an allowlist as React elements; server HTML is never injected into the active DOM. */
export function NoticeContent({ html }: { html: string }) {
    const base = typeof window === 'undefined' ? 'https://localhost/' : window.location.href
    function render(node: Node, key: string): ReactNode {
        if (node.nodeType === 3) return node.textContent
        if (node.nodeType !== 1 || !(node instanceof Element)) return null
        const tag = node.tagName.toLowerCase()
        const children = Array.from(node.childNodes, (child, index) => render(child, `${key}-${index}`))
        if (!ALLOWED.has(tag)) return children
        if (tag === 'img') {
            const src = safeContentUrl(node.getAttribute('src') ?? '', base)
            return src ? createElement('img', { key, src, alt: node.getAttribute('alt') ?? '', loading: 'lazy', referrerPolicy: 'no-referrer' }) : null
        }
        if (tag === 'a') return createElement('a', { key, href: safeContentUrl(node.getAttribute('href') ?? '', base), target: '_blank', rel: 'noopener noreferrer' }, children)
        if (tag === 'br' || tag === 'hr') return createElement(tag, { key })
        return createElement(tag, { key }, children)
    }
    return <div className="notice-content">{Array.from(parseNoticeBody(html).childNodes, (node, index) => render(node, String(index)))}</div>
}
