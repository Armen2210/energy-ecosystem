import assert from 'node:assert/strict';
import { parse } from 'parse5';

export function nodes(node) {
  return [node, ...(node.childNodes || []).flatMap(nodes)];
}
export const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
export function text(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
}

export function validatePage(html, route, routes) {
  const all = nodes(parse(html));
  const elements = (tag) => all.filter((node) => node.tagName === tag);
  const metas = (key, attribute = 'name') => elements('meta').filter((node) => attr(node, attribute) === key);
  const meta = (key, attribute) => {
    const matches = metas(key, attribute);
    assert.equal(matches.length, 1, `${route}: exactly one ${key}`);
    const value = attr(matches[0], 'content');
    assert.ok(value, `${route}: empty ${key}`);
    return value;
  };
  const title = elements('title');
  assert.equal(title.length, 1, route);
  assert.ok(text(title[0]), route);
  const description = meta('description');
  assert.equal(meta('og:title', 'property'), text(title[0]), route);
  assert.equal(meta('twitter:title'), text(title[0]), route);
  assert.equal(meta('og:description', 'property'), description, route);
  assert.equal(meta('twitter:description'), description, route);
  for (const [key, attribute] of [['og:type', 'property'], ['og:image', 'property'], ['og:locale', 'property'], ['twitter:card'], ['twitter:image']]) meta(key, attribute);
  const canonical = elements('link').filter((node) => attr(node, 'rel') === 'canonical');
  if (route === '/404') {
    assert.equal(meta('robots'), 'noindex, follow');
    assert.equal(canonical.length, 0);
    assert.equal(metas('og:url', 'property').length, 0);
  } else {
    assert.equal(meta('robots'), 'index, follow');
    assert.equal(canonical.length, 1);
    assert.equal(attr(canonical[0], 'href'), 'https://www.energoeffekt-rostov.ru' + route);
    assert.equal(meta('og:url', 'property'), attr(canonical[0], 'href'));
  }
  const root = all.find((node) => attr(node, 'id') === 'root');
  assert.equal(attr(root, 'data-prerendered'), 'true', route);
  const content = nodes(root);
  const mains = content.filter((node) => node.tagName === 'main');
  assert.equal(mains.length, 1, route);
  assert.ok(text(mains[0]).trim().length > (route === '/404' ? 100 : 200), `${route}: missing main text`);
  const headings = content.filter((node) => /^h[123]$/.test(node.tagName));
  assert.equal(headings.filter((node) => node.tagName === 'h1').length, 1, route);
  assert.ok(headings.every((node) => text(node).trim()), route);
  assert.ok(text(root).trim().length > 500, `${route}: missing page content`);
  for (const anchor of elements('a')) {
    const href = attr(anchor, 'href');
    if (href?.startsWith('/')) {
      const url = new URL(href, 'https://www.energoeffekt-rostov.ru');
      assert.ok(routes.includes(url.pathname) || url.pathname === '/contacts', `${route}: dead link ${href}`);
    }
  }
  const schemas = elements('script').filter((node) => attr(node, 'type') === 'application/ld+json').map((node) => JSON.parse(text(node)));
  assert.equal(schemas.filter((schema) => schema['@type'] === 'Organization').length, 1, route);
  const organization = schemas.find((schema) => schema['@type'] === 'Organization');
  assert.equal(organization['@id'], 'https://www.energoeffekt-rostov.ru/#organization', route);
  assert.equal(organization.url, 'https://www.energoeffekt-rostov.ru/', route);
  if (/^\/(solutions|services)\//.test(route)) {
    const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
    assert.ok(faq?.mainEntity?.length, `${route}: missing FAQ`);
    assert.equal(faq.url, 'https://www.energoeffekt-rostov.ru' + route);
    assert.equal(faq['@id'], faq.url + '#faq');
    const byClass = (className) => content.filter((node) => attr(node, 'class')?.split(' ').includes(className)).map(text);
    assert.deepEqual(byClass('faq__question'), faq.mainEntity.map((item) => item.name));
    assert.deepEqual(byClass('faq__answer'), faq.mainEntity.map((item) => item.acceptedAnswer.text));
  }
  assert.ok(!content.some((node) => attr(node, 'class')?.includes('cookie-banner')), `${route}: consent UI in artifact`);
  assert.ok(!content.some((node) => attr(node, 'role') === 'dialog'), `${route}: open modal`);
  assert.ok(!content.some((node) => attr(node, 'class')?.includes('lead-form__status')), `${route}: submission state`);
  for (const form of elements('form')) {
    assert.equal(attr(form, 'method'), 'post', `${route}: native GET is unsafe`);
    assert.ok(nodes(form).some((node) => node.tagName === 'fieldset' && attr(node, 'disabled') !== undefined), `${route}: early input enabled`);
    assert.ok(nodes(form).some((node) => node.tagName === 'noscript'), `${route}: missing no-JS explanation`);
    for (const field of nodes(form).filter((node) => ['input', 'textarea'].includes(node.tagName))) {
      const name = attr(field, 'name');
      if (['name', 'company_name', 'phone', 'email', 'description'].includes(name)) {
        assert.equal(field.tagName === 'textarea' ? text(field) : attr(field, 'value') || '', '', `${route}: visitor data`);
      }
      assert.equal(attr(field, 'checked'), undefined, `${route}: consent checked`);
      assert.ok(!['submission_id', 'campaign_attribution'].includes(name), `${route}: visitor identifiers`);
    }
  }
  assert.ok(!elements('script').some((node) => /^https?:/.test(attr(node, 'src') || '')), `${route}: external script`);
  return { title: text(title[0]), description };
}
