// Minimal, safe Markdown renderer (~no dependencies).
// Input is HTML-escaped FIRST, so authored content can never inject markup.
//
// Supported: headings, bold, italic, inline code, fenced code, links,
// unordered/ordered lists (1 nesting level), blockquotes, tables, hr,
// paragraphs, hard line breaks — plus one custom extension:
//
//   {{Marginal Rate of Substitution}}  ->  <span class="term">…</span>
//
// The {{…}} extension is how Bangla explanations keep economic /
// theoretical terminology in English and visually distinct.

import { esc, slug } from './util.js';

function inline(s) {
  return s
    // custom: English terminology inside Bangla prose
    .replace(/\{\{([^{}]+)\}\}/g, '<span class="term">$1</span>')
    // images are intentionally unsupported; links only
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, href) =>
      /^(https?:|#|content\/|assets\/)/.test(href)
        ? `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`
        : t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/ {2,}$/gm, '<br>');
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isDivider  = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes('-');
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/**
 * Render markdown to an HTML string.
 * @param {string} src
 * @param {{headings?: Array}} [collect] optional sink that receives {level,text,id}
 */
export function md(src, collect) {
  if (!src) return '';
  const lines = esc(String(src).replace(/\r\n?/g, '\n')).split('\n');
  const out = [];
  let i = 0;

  const flushPara = (buf) => {
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
    buf.length = 0;
  };
  const para = [];

  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    if (/^\s*```/.test(line)) {
      flushPara(para);
      const lang = line.replace(/^\s*```/, '').trim();
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(`<pre><code${lang ? ` class="lang-${esc(lang)}"` : ''}>${body.join('\n')}</code></pre>`);
      continue;
    }

    // blank
    if (!line.trim()) { flushPara(para); i++; continue; }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(para);
      const lvl = h[1].length;
      const text = h[2].trim();
      const id = slug(text.replace(/\{\{|\}\}/g, '')) || `h${i}`;
      if (collect && lvl <= 3) collect.push({ level: lvl, text: text.replace(/\{\{|\}\}/g, ''), id });
      out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`);
      i++; continue;
    }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushPara(para); out.push('<hr>'); i++; continue;
    }

    // table
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      flushPara(para);
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && isTableRow(lines[i])) body.push(cells(lines[i++]));
      out.push(
        '<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>'
      );
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      flushPara(para);
      const body = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote>${md(body.join('\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))}</blockquote>`);
      continue;
    }

    // lists (supports one level of nesting via 2+ space indent)
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flushPara(para);
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const tag = ordered ? 'ol' : 'ul';
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        const indent = lines[i].match(/^\s*/)[0].length;
        const text = lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        items.push({ indent, text });
        i++;
      }
      const base = Math.min(...items.map((it) => it.indent));
      let buf = `<${tag}>`;
      let open = false, nested = false;
      for (const it of items) {
        if (it.indent > base) {
          if (!nested) { buf += '<ul>'; nested = true; }
          buf += `<li>${inline(it.text)}</li>`;
        } else {
          if (nested) { buf += '</ul>'; nested = false; }
          if (open) buf += '</li>';
          buf += `<li>${inline(it.text)}`;
          open = true;
        }
      }
      if (nested) buf += '</ul>';
      if (open) buf += '</li>';
      buf += `</${tag}>`;
      out.push(buf);
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara(para);
  return out.join('\n');
}

/** Render markdown and also return the h2/h3 outline for a table of contents. */
export function mdWithToc(src) {
  const headings = [];
  const body = md(src, headings);
  return { body, headings };
}

/** Strip markdown down to plain text — used for search indexing and previews. */
export function plain(src, max = 220) {
  const t = String(src || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\{\{([^{}]+)\}\}/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return max && t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}
