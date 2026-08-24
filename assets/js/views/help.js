import { mdWithToc } from '../markdown.js';
import { pageHead, empty } from '../ui.js';
import { esc } from '../util.js';

// The in-app guide is the same file as docs/AUTHORING.md — one source of truth.
export default async function help() {
  const head = pageHead({
    crumbs: [{ label: 'How to add content' }],
    title: 'Adding content',
    sub: 'How the JSON files map onto every screen in this app.',
  });

  let src;
  try {
    const res = await fetch('docs/AUTHORING.md', { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    src = await res.text();
  } catch {
    return head + empty('Could not load docs/AUTHORING.md',
      'Open the file directly in the repository instead.');
  }

  const { body, headings } = mdWithToc(src);
  const toc = headings.length ? `<aside class="rail"><div class="rail-card">
    <div class="rail-head">Contents</div>
    <div class="rail-body toc">${headings.map((h) =>
      `<a href="#${esc(h.id)}" class="lvl${h.level}">${esc(h.text)}</a>`).join('')}</div>
  </div></aside>` : '';

  return head + `<div class="reader${toc ? '' : ' solo'}">
    <article class="prose">${body}</article>${toc}</div>`;
}
