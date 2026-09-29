import { Marked } from "marked";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Raw HTML in posts is escaped rather than rendered, and only http(s)/mailto
// and relative links are allowed, so post content can't inject scripts.
const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const safe = /^(https?:|mailto:|\/|#)/i.test(href) ? href : "#";
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      const external = /^https?:/i.test(safe) ? ' rel="noopener noreferrer" target="_blank"' : "";
      return `<a href="${escapeHtml(safe)}"${t}${external}>${this.parser.parseInline(tokens)}</a>`;
    },
    image({ href, title, text }) {
      const safe = /^(https?:|\/)/i.test(href) ? href : "";
      if (!safe) return escapeHtml(text);
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(text)}"${t} loading="lazy" />`;
    },
  },
});

export function renderMarkdown(md: string) {
  return marked.parse(md, { async: false });
}
