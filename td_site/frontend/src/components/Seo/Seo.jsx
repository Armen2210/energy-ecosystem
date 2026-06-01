import { useEffect } from "react"

const SITE_URL = "https://td-energoeffect.ru"
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

function setMetaAttribute(selector, attribute, value) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement("meta")
    document.head.appendChild(element)
  }

  element.setAttribute(attribute, value)
}

function Seo({ title, description, path = "/" }) {
  const canonicalUrl = `${SITE_URL}${path}`

  useEffect(() => {
    document.title = title

    setMetaAttribute('meta[name="description"]', "content", description)

    let canonical = document.head.querySelector('link[rel="canonical"]')

    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }

    canonical.setAttribute("href", canonicalUrl)

    setMetaAttribute('meta[property="og:type"]', "property", "og:type")
    setMetaAttribute('meta[property="og:type"]', "content", "website")

    setMetaAttribute('meta[property="og:title"]', "property", "og:title")
    setMetaAttribute('meta[property="og:title"]', "content", title)

    setMetaAttribute('meta[property="og:description"]', "property", "og:description")
    setMetaAttribute('meta[property="og:description"]', "content", description)

    setMetaAttribute('meta[property="og:url"]', "property", "og:url")
    setMetaAttribute('meta[property="og:url"]', "content", canonicalUrl)

    setMetaAttribute('meta[property="og:image"]', "property", "og:image")
    setMetaAttribute('meta[property="og:image"]', "content", DEFAULT_IMAGE)

    setMetaAttribute('meta[name="twitter:title"]', "name", "twitter:title")
    setMetaAttribute('meta[name="twitter:title"]', "content", title)

    setMetaAttribute('meta[name="twitter:description"]', "name", "twitter:description")
    setMetaAttribute('meta[name="twitter:description"]', "content", description)

    setMetaAttribute('meta[name="twitter:image"]', "name", "twitter:image")
    setMetaAttribute('meta[name="twitter:image"]', "content", DEFAULT_IMAGE)
  }, [title, description, canonicalUrl])

  return null
}

export default Seo