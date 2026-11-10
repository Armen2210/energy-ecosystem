import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documents, documentCategories, populatedDocumentCategories, formatDocumentSize } from '../src/data/documents.js';
import { documentFiles, validateDocumentFile, validateDocumentFiles } from './document-files.mjs';
import { safePath, pageParams, safeParams } from '../src/analytics/policy.js';

test('registry has ordered questionnaires, partners and SOUT with all published files', () => {
  const questionnaires = documents.filter(item => item.categoryId === 'questionnaires');
  assert.deepEqual(questionnaires.map(item => item.productSlug), ['bmk', 'btp', 'vns', 'pns']);
  assert.equal(new Set(documents.map(item => item.id)).size, 22);
  assert.deepEqual(populatedDocumentCategories().map(category => category.id), ['questionnaires', 'product-certificates', 'partner-certificates', 'sout', 'other']);
  assert.equal(documentCategories.length, 7);
  assert.equal(documentFiles.length, 26);
  const root = fileURLToPath(new URL('../public/', import.meta.url));
  const actual = readdirSync(path.join(root, 'documents'), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile()).map(entry => path.relative(root, path.join(entry.parentPath, entry.name))).sort();
  assert.deepEqual(actual, documentFiles.map(file => file.url.slice(1)).sort());
  validateDocumentFiles();
  for (const document of questionnaires) {
    assert.deepEqual(document.files.map(file => file.format), ['xlsx', 'pdf']);
    for (const file of document.files) assert.equal(file.behavior, 'download');
    assert.equal(document.files[0].purpose, 'Для заполнения на компьютере');
    assert.equal(document.files[1].purpose, 'Для печати и заполнения от руки');
  }
  assert.equal(documentCategories[0].description, 'Скачайте опросный лист для заполнения или передачи специалисту. Excel — для заполнения на компьютере, PDF — для печати');
  assert.equal(formatDocumentSize(1024), '1 КБ');
  assert.equal(formatDocumentSize(1024 * 1024), '1 МБ');
});

test('six new PDFs open, SOUT is 2026 then 2022, with no invented completeness claim', () => {
  const partners = populatedDocumentCategories().find(category => category.id === 'partner-certificates');
  assert.deepEqual(partners.documents.map(document => document.id), ['vzlet-partner', 'termotronic-partner', 'tess-dealer', 'teplosila-dealer']);
  const sout = populatedDocumentCategories().find(category => category.id === 'sout');
  assert.deepEqual(sout.documents.map(document => document.title), ['Результаты СОУТ — 2026', 'Результаты СОУТ — 2022']);
  for (const document of [...partners.documents, ...sout.documents]) {
    assert.equal(document.files.length, 1);
    assert.equal(document.files[0].format, 'pdf');
    assert.equal(document.files[0].behavior, 'open');
  }
  for (const document of sout.documents) {
    assert.equal(document.description, 'Сводная ведомость результатов и перечень рекомендуемых мероприятий');
  }
  assert.equal(sout.documents[1].files[0].url, '/documents/sout/ee-sout-2022.pdf');
});

test('PDF behavior remains per variant, including future certificates, letters and SOUT', () => {
  const pdf = documents[0].files[1];
  validateDocumentFile(pdf);
  validateDocumentFile({ ...pdf, behavior: 'open' });
  for (const categoryId of ['product-certificates', 'letters', 'sout']) {
    const future = { id: 'future-document', categoryId, title: 'Документ', order: 1, files: [{ ...pdf, behavior: 'open' }] };
    const categories = populatedDocumentCategories([...documents, future]);
    const inserted = categories.find(category => category.id === categoryId).documents.find(document => document.id === 'future-document');
    assert.equal(inserted.files.length, 1);
    assert.equal(inserted.files[0].format, 'pdf');
    assert.equal(inserted.files[0].behavior, 'open');
  }
});

test('missing, mislabeled, stale-sized and altered public files fail validation', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'ee-document-test-'));
  const file = documentFiles[0];
  try {
    assert.throws(() => validateDocumentFile(file, directory));
    const target = path.join(directory, file.url);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, 'not an Excel workbook');
    assert.throws(() => validateDocumentFile(file, directory));
    assert.throws(() => validateDocumentFile({ ...file, format: 'pdf' }));
    assert.throws(() => validateDocumentFile({ ...file, sizeBytes: file.sizeBytes + 1 }));
    assert.throws(() => validateDocumentFile({ ...file, sha256: '0'.repeat(64) }));
    assert.throws(() => validateDocumentFile({ ...file, behavior: 'attachment-all-pdfs' }));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('documents page is a bounded known analytics route; file paths remain unrecognized', () => {
  assert.equal(safePath('/documents'), '/documents');
  assert.deepEqual(pageParams('/documents'), { page_category: 'documents' });
  assert.deepEqual(safeParams(pageParams('/documents')), { page_category: 'documents' });
  assert.equal(safePath(documentFiles[0].url), '/404');
  assert.equal(safePath('/documents/missing'), '/404');
});
