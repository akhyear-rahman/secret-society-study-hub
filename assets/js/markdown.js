// Minimal, safe Markdown renderer (~no dependencies).
// Input is HTML-escaped FIRST, so authored content can never inject markup.
//
// Supported: headings, bold, italic, inline code, fenced code, links,
// unordered/ordered lists (1 nesting level), blockquotes, tables, hr,
// paragraphs, hard line breaks — plus three custom extensions:
//
//   {{Marginal Rate of Substitution}}  ->  <span class="term">…</span>
//   $x^a$  and  $$…$$                  ->  LaTeX, rendered by math.js
//   ![caption](content/figures/x.svg)  ->  <figure> with a caption
//
// The {{…}} extension is how Bangla explanations keep economic /
// theoretical terminology in English and visually distinct.
//
// MATH IS EXTRACTED BEFORE ESCAPING and restored at the very end. It has to
// be: `\frac{a}{b}` would otherwise be chewed up by the `_` → <em> rule and
// `\\` by the escaper. Placeholders use private-use code points, which no
// markdown rule and no escape touches. Math inside fenced code or inline
// backticks is deliberately left alone.

import { esc, slug } from './util.js';

const M_OPEN = '';
const M_CLOSE = '';

/** Pull $…$ / $$…$$ out of the source, leaving inert placeholders behind. */
function stashMath(src, store) {
  const lines = String(src).split('\n');
  let inFence = false;

  return lines.map((line) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;

    // Display first, so $$…$$ is never mistaken for two inline spans.
    let out = line.replace(/\$\$([^$]+?)\$\$/g, (m, tex) => {
      store.push({ tex: tex.trim(), display: true });
      return `${M_OPEN}${store.length - 1}${M_CLOSE}`;
    });

    // Inline. The leading `\`[^`]*\`` alternative consumes inline code first,
    // so a `$` inside backticks can never open a formula. Requires a closing
    // `$` on the same line, which is why a lone "costs $1" stays untouched.
    out = out.replace(/`[^`]*`|\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (m, tex) => {
      if (m[0] === '`') return m;
      store.push({ tex: tex.trim(), display: false });
      return `${M_OPEN}${store.length - 1}${M_CLOSE}`;
    });
    return out;
  }).join('\n');
}

/** Swap placeholders back for math nodes. Runs after all escaping. */
function restoreMath(htmlStr, store) {
  if (!store.length) return htmlStr;
  return htmlStr.replace(
    new RegExp(`${M_OPEN}(\\d+)${M_CLOSE}`, 'g'),
    (m, idx) => {
      const item = store[Number(idx)];
      if (!item) return '';
      const cls = item.display ? 'math math-display' : 'math';
      return `<span class="${cls}" data-tex="${esc(item.tex)}"` +
             `${item.display ? ' data-display="1"' : ''}>${esc(item.tex)}</span>`;
    }
  );
}

function inline(s) {
  return s
    // custom: English terminology inside Bangla prose
    .replace(/\{\{([^{}]+)\}\}/g, '<span class="term">$1</span>')
    // figures: only from paths we generate ourselves, never remote
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) =>
      /^(content\/figures\/|assets\/)/.test(src)
        ? `<figure class="fig"><img src="${src}" alt="${alt}" loading="lazy" decoding="async">` +
          (alt ? `<figcaption>${alt}</figcaption>` : '') + '</figure>'
        : alt)
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
  // Math comes out before escaping and goes back in after rendering. A nested
  // md() call (blockquotes) finds no `$` left to stash, so its store is empty
  // and its restore is a no-op — the outer call still owns those placeholders.
  const mathStore = [];
  const stashed = stashMath(String(src).replace(/\r\n?/g, '\n'), mathStore);
  const lines = esc(stashed).split('\n');
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
  return restoreMath(out.join('\n'), mathStore);
}

/**
 * Render a short single-line string — emphasis, code, links and maths — with
 * NO block wrapper.
 *
 * Exam questions and card prompts sit inside summaries, table cells and <p>
 * elements that already carry their own styling. Passing them through md()
 * would nest a <p> inside a <p>, which the parser then tears apart. But they
 * still need the maths rendered: an ECON 401 question is largely notation,
 * and esc() alone leaves the reader looking at raw TeX.
 */
export function mdInline(src) {
  if (!src) return '';
  const store = [];
  // One line only — fold any whitespace run, including newlines, to a space.
  const flat = String(src).replace(/\s+/g, ' ');
  return restoreMath(inline(esc(stashMath(flat, store))), store);
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
    .replace(/\$\$[^$]+?\$\$/g, ' ')            // display math is not searchable prose
    .replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')   // keep the figure caption, drop the path
    .replace(/\{\{([^{}]+)\}\}/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return max && t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}
