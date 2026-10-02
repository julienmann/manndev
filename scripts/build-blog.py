#!/usr/bin/env python3
"""Builds the Insights section (manndev.com/blog/) from blog-src/.

  blog-src/posts/<slug>.html  one file per article: a metadata comment, then the body HTML
  blog-src/blog.css           shared styles, inlined into every page (no extra request)

Writes blog/index.html, blog/<slug>/index.html and blog/feed.xml, and refreshes the
Insights entries in sitemap.xml and llms.txt (between the blog markers). Each article
gets canonical/OG/Twitter tags, BlogPosting + BreadcrumbList JSON-LD, a table of contents
from its <h2>s, a reading time and related reading, so a new article is one file.

An article starts like this (updated:, dek: and featured: are optional; dek defaults to the
description, and the hub features the newest post marked featured: yes, else the newest):

  <!--
  title: Core Web Vitals, explained for business owners
  description: One or two sentences for search results and the Insights list.
  dek: Optional longer standfirst shown under the headline.
  date: 2026-10-02
  updated: 2026-10-02
  topic: Performance
  featured: yes
  -->
  <p>First paragraph...</p>
  <h2>A section</h2>

Run after adding or editing anything in blog-src/, then commit blog/, sitemap.xml and
llms.txt with the source. Stdlib only.
"""
import html
import json
import math
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'blog-src'
OUT = ROOT / 'blog'
SITE = 'https://manndev.com'
BLOG = SITE + '/blog/'
AUTHOR = 'Julien Mann'
TOPICS = ['Web Design', 'Performance', 'Accessibility', 'SEO', 'Business']   # display order
WPM = 225

HUB_TITLE = 'Insights: Web Design Guides for Small Businesses · Mann Dev'
HUB_DESC = ('Practical guides on web design, performance, accessibility and SEO for small '
            'business owners, written by a Montréal web developer. No jargon, no sales pitch.')

ARROW = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>')
UNDERLINE = '<span class="cta-underline-wrap"><span class="cta-underline" style="display:block"></span></span>'


def fail(msg):
    sys.exit(f'build-blog: {msg}')


def esc(s):
    return html.escape(s, quote=True)


def slugify(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', s)).lower()
    s = s.translate(str.maketrans('àâäçéèêëîïôöùûüÿœ', 'aaaceeeeiioouuuyo'))
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def long_date(d):
    return f'{d:%B} {d.day}, {d.year}'


# ── read the posts ──
def load(path):
    text = path.read_text(encoding='utf-8')
    m = re.match(r'\s*<!--(.*?)-->\s*', text, re.S)
    if not m:
        fail(f'{path.name}: missing the metadata comment at the top')
    meta = {}
    for line in m.group(1).strip().splitlines():
        if line.strip():
            key, sep, val = line.partition(':')
            if not sep:
                fail(f'{path.name}: bad metadata line {line!r}')
            meta[key.strip()] = val.strip()
    for key in ('title', 'description', 'date', 'topic'):
        if not meta.get(key):
            fail(f'{path.name}: no "{key}:" in the metadata')
    if meta['topic'] not in TOPICS:
        fail(f'{path.name}: topic "{meta["topic"]}" is not one of {", ".join(TOPICS)}')
    if '—' in text:
        fail(f'{path.name}: em dash found (DESIGN.md: The Plain Punctuation Rule)')

    body = text[m.end():].strip()
    toc, seen = [], set()

    def anchor(h):
        attrs, inner = h.group(1), h.group(2)
        found = re.search(r'\bid="([^"]+)"', attrs)
        hid = found.group(1) if found else slugify(inner)
        if hid in seen:
            fail(f'{path.name}: two headings share the id "{hid}"')
        seen.add(hid)
        toc.append((hid, re.sub(r'<[^>]+>', '', inner)))
        return h.group(0) if found else f'<h2 id="{hid}"{attrs}>{inner}</h2>'
    body = re.sub(r'<h2([^>]*)>(.*?)</h2>', anchor, body, flags=re.S)

    words = len(re.sub(r'<[^>]+>', ' ', body).split())
    published = date.fromisoformat(meta['date'])
    updated = date.fromisoformat(meta.get('updated') or meta['date'])
    return {
        'slug': path.stem,
        'url': f'{BLOG}{path.stem}/',
        'path': f'/blog/{path.stem}/',
        'title': meta['title'],
        'description': meta['description'],
        'dek': meta.get('dek') or meta['description'],
        'topic': meta['topic'],
        'topic_slug': slugify(meta['topic']),
        'date': published,
        'updated': max(updated, published),
        'minutes': max(1, math.ceil(words / WPM)),
        'words': words,
        'featured': meta.get('featured', '').lower() in ('yes', 'true'),
        'body': body,
        'toc': toc,
    }


posts = [load(p) for p in sorted((SRC / 'posts').glob('*.html'))]
if not posts:
    fail('no posts in blog-src/posts/')
posts.sort(key=lambda p: (-p['date'].toordinal(), p['title']))
CSS = (SRC / 'blog.css').read_text(encoding='utf-8').strip()
last_updated = max(p['updated'] for p in posts)


# ── shared page shell ──
def page(*, title, description, canonical, og_type, jsonld, main, head_extra='', script='', current=''):
    insights_current = ' aria-current="page"' if current == 'hub' else ''
    return f'''<!DOCTYPE html>
<!-- Generated by scripts/build-blog.py from blog-src/. Edit those, not this file. -->
<html lang="en">
<head>
<meta charset="UTF-8">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2ZEZB4R3CP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-2ZEZB4R3CP');
</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{canonical}">
<link rel="alternate" type="application/rss+xml" title="Mann Dev Insights" href="{BLOG}feed.xml">
<meta name="author" content="{AUTHOR}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#1e2530">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Mann Dev">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_CA">
{head_extra}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{SITE}/img/og-image.png">
<link rel="icon" type="image/png" href="/img/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/img/favicon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Figtree:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Figtree:wght@300;400;500;600&display=swap"></noscript>
<style>
{CSS}
</style>
<script type="application/ld+json">
{json.dumps(jsonld, indent=2, ensure_ascii=False)}
</script>
</head>
<body>

<!-- HEADER -->
<header>
  <a href="/" class="h-logo" aria-label="Mann Dev Home">
    <img src="/img/logo.png?v=2" alt="" width="298" height="59">
  </a>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/#services">Services</a></li>
      <li class="nav-hide-mobile"><a href="/#process">Process</a></li>
      <li><a href="/blog/"{insights_current}>Insights</a></li>
      <li><a href="/contact/">Contact</a></li>
      <li><a href="https://portal.manndev.com/" class="nav-portal">Portal</a></li>
      <li class="nav-lang-item"><a href="/fr/" class="nav-lang" id="lang-toggle" data-lang="fr" hreflang="fr" lang="fr" aria-label="Français">FR</a></li>
    </ul>
  </nav>
</header>

{main}

<!-- FOOTER -->
<footer>
  <div class="divider-inner"></div>
  <div class="footer-inner">
    <a href="/" class="footer-logo" aria-label="Mann Dev Home">
      <img src="/img/logo.png?v=2" alt="" width="298" height="59" loading="lazy">
    </a>
    <nav class="footer-nav" aria-label="Footer navigation">
      <a href="/#services">Services</a>
      <a href="/#process">Process</a>
      <a href="/#about">About</a>
      <a href="/blog/">Insights</a>
      <a href="/contact/">Contact</a>
      <a href="https://portal.manndev.com/" class="footer-portal">Portal</a>
    </nav>
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">&copy; {date.today().year} Mann Dev.</p>
    <a href="/blog/feed.xml" class="footer-feed">Insights RSS feed</a>
  </div>
</footer>

<script>
/* remember an explicit language pick so the redirect on the home page respects it */
document.getElementById('lang-toggle').addEventListener('click', e => {{
  try {{ localStorage.setItem('lang', e.currentTarget.dataset.lang); }} catch (err) {{}}
  if (typeof gtag === 'function') gtag('event', 'language_switch', {{ language: e.currentTarget.dataset.lang }});
}});
{script}</script>
</body>
</html>
'''


PUBLISHER = {'@id': f'{SITE}/#business'}
PERSON = {'@type': 'Person', 'name': AUTHOR, 'url': f'{SITE}/',
          'sameAs': ['https://www.linkedin.com/in/julien-mann-b153aa404/']}


def posting(p, full=False):
    d = {
        '@type': 'BlogPosting',
        'headline': p['title'],
        'description': p['description'],
        'url': p['url'],
        'datePublished': p['date'].isoformat(),
        'dateModified': p['updated'].isoformat(),
        'author': PERSON,
        'publisher': PUBLISHER,
        'image': f'{SITE}/img/og-image.png',
        'articleSection': p['topic'],
    }
    if full:
        d.update({'@id': p['url'] + '#article', 'mainEntityOfPage': p['url'],
                  'wordCount': p['words'], 'inLanguage': 'en-CA',
                  'isPartOf': {'@id': BLOG + '#blog'}})
    return d


def crumbs_ld(*items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i, 'name': name, 'item': url}
        for i, (name, url) in enumerate(items, 1)]}


def meta_line(p):
    return (f'<time datetime="{p["date"].isoformat()}">{long_date(p["date"])}</time>'
            f'<span class="meta-sep" aria-hidden="true">&middot;</span>{p["minutes"]} min read')


def library(items, heading_level='h3'):
    rows = []
    for n, p in enumerate(items, 1):
        rows.append(f'''    <li class="entry" data-topic="{p['topic_slug']}">
      <a class="entry-link" href="{p['path']}">
        <span class="entry-num" aria-hidden="true">{n:02d}</span>
        <div>
          <{heading_level} class="entry-title"><span>{esc(p['title'])}</span></{heading_level}>
          <p class="entry-p">{esc(p['description'])}</p>
        </div>
        <div class="entry-side">
          <span class="tag">{p['topic']}</span>
          <span class="meta">{p['minutes']} min read</span>
        </div>
        <span class="entry-arrow" aria-hidden="true">{ARROW}</span>
      </a>
    </li>''')
    return '\n'.join(rows)


# ── /blog/ ──
def build_hub():
    counts = {t: sum(p['topic'] == t for p in posts) for t in TOPICS}
    buttons = [f'<button type="button" class="topic-btn" data-topic="all" aria-pressed="true">All<span class="topic-count">{len(posts)}</span></button>']
    buttons += [f'<button type="button" class="topic-btn" data-topic="{slugify(t)}" aria-pressed="false">{t}<span class="topic-count">{n}</span></button>'
                for t, n in counts.items() if n]
    f = next((p for p in posts if p['featured']), posts[0])
    feature_toc = '\n'.join(f'          <li>{esc(t)}</li>' for _, t in f['toc'][:5])
    main = f'''<main class="container">
  <div class="hub-head">
    <div>
      <p class="kicker rise">Insights</p>
      <h1 class="hub-h1 rise rise-2">Web design, explained <em>plainly</em>.</h1>
    </div>
    <p class="hub-intro rise rise-3">Practical guides on <strong>web design, performance, accessibility and SEO</strong> for small business owners. Written by the developer who builds the sites, so you can make better decisions about yours.</p>
  </div>

  <div class="topics rise rise-4" role="group" aria-label="Filter guides by topic" hidden>
    <span class="topics-label" aria-hidden="true">Browse by topic</span>
    {(chr(10) + '    ').join(buttons)}
  </div>

  <article class="feature entry rise rise-4" data-topic="{f['topic_slug']}">
    <div>
      <div class="feature-label">
        <span class="feature-flag">Latest guide</span>
        <span class="tag">{f['topic']}</span>
        <span class="meta">{meta_line(f)}</span>
      </div>
      <h2 class="feature-h2"><a href="{f['path']}">{esc(f['title'])}</a></h2>
      <p class="feature-p">{esc(f['description'])}</p>
      <span class="link-cta" aria-hidden="true">Read the guide {ARROW}{UNDERLINE}</span>
    </div>
    <div class="feature-side">
      <p class="feature-side-label">In this guide</p>
      <ol class="feature-toc">
{feature_toc}
      </ol>
    </div>
  </article>

  <div class="library-head">
    <h2 class="library-h2">All guides</h2>
    <p class="meta"><span id="guide-count">{len(posts)} {'guide' if len(posts) == 1 else 'guides'}</span><span class="meta-sep" aria-hidden="true">&middot;</span>Updated <time datetime="{last_updated.isoformat()}">{long_date(last_updated)}</time></p>
  </div>
  <ol class="library" id="library">
{library(posts)}
  </ol>
  <p class="library-empty" id="library-empty" hidden>No guides on this topic yet.</p>

  <div class="divider-inner"></div>

  <section class="ask" aria-labelledby="ask-h2">
    <h2 class="ask-h2" id="ask-h2">Have a question these guides don't answer?</h2>
    <div>
      <p class="ask-p">Ask it directly. Every enquiry is answered personally, usually within 24 hours.</p>
      <a href="/contact/" class="link-cta">Start a project {ARROW}{UNDERLINE}</a>
    </div>
  </section>
</main>'''

    script = '''
/* topic filter: every guide is in the markup, this only hides rows; #topic links work too */
(() => {
  const bar = document.querySelector('.topics');
  const btns = [...bar.querySelectorAll('.topic-btn')];
  const entries = [...document.querySelectorAll('.entry')];
  const rows = entries.filter(e => e.tagName === 'LI');
  const count = document.getElementById('guide-count');
  const empty = document.getElementById('library-empty');
  bar.hidden = false;
  function show(topic, push) {
    if (!btns.some(b => b.dataset.topic === topic)) topic = 'all';
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === topic)));
    entries.forEach(e => { e.hidden = topic !== 'all' && e.dataset.topic !== topic; });
    const n = rows.filter(r => !r.hidden).length;
    count.textContent = n + (n === 1 ? ' guide' : ' guides');
    empty.hidden = n > 0;
    if (push) history.replaceState(null, '', topic === 'all' ? location.pathname : '#' + topic);
  }
  btns.forEach(b => b.addEventListener('click', () => {
    show(b.dataset.topic, true);
    if (typeof gtag === 'function') gtag('event', 'insights_filter', { topic: b.dataset.topic });
  }));
  show(location.hash.slice(1) || 'all', false);
})();
'''
    jsonld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Blog', '@id': BLOG + '#blog', 'name': 'Mann Dev Insights', 'url': BLOG,
         'description': HUB_DESC, 'inLanguage': 'en-CA', 'publisher': PUBLISHER, 'author': PERSON,
         'blogPost': [posting(p) for p in posts]},
        crumbs_ld(('Home', f'{SITE}/'), ('Insights', BLOG)),
    ]}
    return page(title=HUB_TITLE, description=HUB_DESC, canonical=BLOG, og_type='website',
                jsonld=jsonld, main=main, script=script, current='hub')


# ── /blog/<slug>/ ──
def related(p):
    others = [o for o in posts if o is not p]
    others.sort(key=lambda o: (o['topic'] != p['topic'], -o['date'].toordinal()))
    return others[:3]


def build_post(p):
    toc = '\n'.join(f'        <li><a href="#{hid}">{esc(text)}</a></li>' for hid, text in p['toc'])
    aside = f'''    <aside class="post-aside" aria-label="On this page">
      <p class="toc-label">On this page</p>
      <ol class="toc">
{toc}
      </ol>
      <div class="aside-cta">
        <p>Planning a new site, or fixing the one you have?</p>
        <a href="/contact/" class="link-cta">Start a project {ARROW}{UNDERLINE}</a>
      </div>
    </aside>''' if p['toc'] else ''
    updated = ''
    if p['updated'] != p['date']:
        updated = (f'<span class="meta-sep" aria-hidden="true">&middot;</span>'
                   f'Updated <time datetime="{p["updated"].isoformat()}">{long_date(p["updated"])}</time>')
    more = related(p)
    more_html = f'''
  <div class="divider-inner"></div>
  <section aria-labelledby="related-h2">
    <h2 class="related-h2" id="related-h2">Keep reading</h2>
    <ol class="library">
{library(more)}
    </ol>
  </section>''' if more else ''

    main = f'''<div class="read-progress" aria-hidden="true"><span></span></div>
<main class="container">
  <article>
    <div class="post-head">
      <nav aria-label="Breadcrumb" class="rise">
        <ol class="crumbs">
          <li><a href="/">Home</a></li>
          <li><a href="/blog/">Insights</a></li>
          <li><a href="/blog/#{p['topic_slug']}">{p['topic']}</a></li>
        </ol>
      </nav>
      <h1 class="post-h1 rise rise-2">{esc(p['title'])}</h1>
      <p class="post-dek rise rise-3">{esc(p['dek'])}</p>
      <div class="post-byline rise rise-4">
        <span class="post-author">By {AUTHOR}</span>
        <span class="meta">{meta_line(p)}{updated}</span>
      </div>
    </div>

    <div class="post-layout">
{aside}
      <div class="post-main">
        <div class="prose">
{p['body']}
        </div>

        <div class="author-card">
          <span class="author-mark" aria-hidden="true">m/d</span>
          <div>
            <p class="author-name">{AUTHOR}</p>
            <p class="author-p">Julien builds custom websites and web apps for small businesses from Montréal, by hand and without templates. Every site ships fast, accessible and fully owned by the client.</p>
            <a href="/contact/" class="link-cta">Talk to Julien {ARROW}{UNDERLINE}</a>
          </div>
        </div>
      </div>
    </div>
  </article>{more_html}
</main>'''
    head_extra = (f'<meta property="article:published_time" content="{p["date"].isoformat()}">\n'
                  f'<meta property="article:modified_time" content="{p["updated"].isoformat()}">\n'
                  f'<meta property="article:author" content="{AUTHOR}">\n'
                  f'<meta property="article:section" content="{p["topic"]}">\n')
    jsonld = {'@context': 'https://schema.org', '@graph': [
        posting(p, full=True),
        crumbs_ld(('Home', f'{SITE}/'), ('Insights', BLOG), (p['title'], p['url'])),
    ]}
    return page(title=f'{p["title"]} · Mann Dev', description=p['description'], canonical=p['url'],
                og_type='article', jsonld=jsonld, main=main, head_extra=head_extra)


# ── feed, sitemap, llms.txt ──
def rfc822(d):
    return f'{d:%a, %d %b %Y} 12:00:00 -0400'


def build_feed():
    items = '\n'.join(f'''    <item>
      <title>{esc(p['title'])}</title>
      <link>{p['url']}</link>
      <guid isPermaLink="true">{p['url']}</guid>
      <pubDate>{rfc822(p['date'])}</pubDate>
      <category>{esc(p['topic'])}</category>
      <description>{esc(p['description'])}</description>
    </item>''' for p in posts)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mann Dev Insights</title>
    <link>{BLOG}</link>
    <atom:link href="{BLOG}feed.xml" rel="self" type="application/rss+xml"/>
    <description>{esc(HUB_DESC)}</description>
    <language>en-ca</language>
    <lastBuildDate>{rfc822(last_updated)}</lastBuildDate>
{items}
  </channel>
</rss>
'''


def splice(path, start, end, block, before):
    """Replace the text between the start/end markers, or insert it before `before` on the first run."""
    s = path.read_text(encoding='utf-8')
    if start in s:
        s = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: f'{start}\n{block}\n{end}', s, flags=re.S)
    elif s.count(before) == 1:
        s = s.replace(before, f'{start}\n{block}\n{end}\n{before}')
    else:
        fail(f'{path.name}: no blog markers and no unique {before!r} to insert before')
    path.write_text(s, encoding='utf-8')


def sitemap_block():
    def url(loc, mod, freq, prio):
        return f'''  <url>
    <loc>{loc}</loc>
    <lastmod>{mod.isoformat()}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{prio}</priority>
  </url>'''
    return '\n'.join([url(BLOG, last_updated, 'weekly', '0.8')] +
                     [url(p['url'], p['updated'], 'monthly', '0.7') for p in posts])


def llms_block():
    lines = ['## Insights', '',
             f'- [Insights]({BLOG}): Guides on web design, performance, accessibility and SEO for small business owners.']
    lines += [f'- [{p["title"]}]({p["url"]}): {p["description"]}' for p in posts]
    return '\n'.join(lines) + '\n'


OUT.mkdir(exist_ok=True)
(OUT / 'index.html').write_text(build_hub(), encoding='utf-8')
for p in posts:
    (OUT / p['slug']).mkdir(exist_ok=True)
    (OUT / p['slug'] / 'index.html').write_text(build_post(p), encoding='utf-8')
(OUT / 'feed.xml').write_text(build_feed(), encoding='utf-8')

stale = sorted(d.name for d in OUT.iterdir() if d.is_dir() and d.name not in {p['slug'] for p in posts})
splice(ROOT / 'sitemap.xml', '  <!-- blog:start (scripts/build-blog.py) -->', '  <!-- blog:end -->', sitemap_block(), '</urlset>')
splice(ROOT / 'llms.txt', '<!-- blog:start (scripts/build-blog.py) -->', '<!-- blog:end -->', llms_block(), '## Optional')

if stale:
    print('build-blog: no source for blog/' + ', blog/'.join(stale) + '/ (delete it if the post was removed)')
print(f'Built blog/ ({len(posts)} posts), blog/feed.xml, and refreshed sitemap.xml and llms.txt. '
      "Commit and push, then 'git pull' on the server.")
