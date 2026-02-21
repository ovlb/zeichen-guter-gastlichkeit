/**
 * Lazy prefetch — preloads linked pages when they scroll into view.
 *
 * Usage:
 *   <a href="/page/" data-prefetch>…</a>        <!-- prefetches own href -->
 *   <div data-prefetch="/other/">…</div>         <!-- prefetches explicit URL -->
 *
 * Load this script with `loading="lazy"`:
 *   <script type="module" loading="lazy" src="/js/prefetch.js"></script>
 */

const alreadyPrefetched = new Set<string>()

function addPrefetchLink(href: string) {
  if (alreadyPrefetched.has(href)) return

  alreadyPrefetched.add(href)

  const linkElement = Object.assign(document.createElement('link'), {
    rel: 'prefetch',
    href,
  })

  document.head.append(linkElement)
}

function resolveHref(element: HTMLElement): string | undefined {
  if (element instanceof HTMLAnchorElement) return element.href

  return element.dataset.prefetch
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue

    const href = resolveHref(entry.target as HTMLElement)

    if (href) addPrefetchLink(href)

    observer.unobserve(entry.target)
  }
})

const targets = document.querySelectorAll<HTMLElement>('[data-prefetch]')

for (const target of targets) {
  observer.observe(target)
}
