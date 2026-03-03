const BLOCK_TAGS = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];

export function sanitizeHtml(input: string): string {
  const html = String(input || '');
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || '').trim().toLowerCase();
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}

export function toPlainText(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(html || '').replace(/<[^>]*>/g, ' ');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');
  return String(doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function splitDescriptionBlocks(html: string): Array<{ text: string; html: string }> {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    const text = toPlainText(html);
    return text ? [{ text, html: `<p>${text}</p>` }] : [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');

  const blocks = Array.from(doc.body.querySelectorAll(BLOCK_TAGS.join(',')))
    .map((el) => {
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        text,
        html: el.outerHTML,
      };
    })
    .filter((block) => block.text.length > 0);

  if (blocks.length > 0) return blocks;

  const fallback = String(doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  return fallback ? [{ text: fallback, html: `<p>${fallback}</p>` }] : [];
}
