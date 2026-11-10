import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { documents } from '../src/data/documents.js';

export const documentFiles = documents.flatMap(document => document.files);
export const documentFilesByUrl = new Map(documentFiles.map(file => [file.url, file]));
const defaultRoot = fileURLToPath(new URL('../public/', import.meta.url));

export function validateDocumentFile(file, root = defaultRoot) {
  assert.ok(['pdf', 'xlsx', 'docx'].includes(file.format), `Unknown document format: ${file.format}`);
  assert.match(file.url, /^\/documents\/(?:[a-z0-9-]+\/)+[a-z0-9-]+\.(pdf|xlsx|docx)$/);
  assert.equal(path.extname(file.url), '.' + file.format);
  assert.ok(['download', 'open'].includes(file.behavior), `${file.url}: unsupported link behavior`);
  const filename = path.resolve(root, '.' + file.url);
  assert.ok(filename.startsWith(path.resolve(root) + path.sep));
  const bytes = readFileSync(filename);
  assert.equal(bytes.length, file.sizeBytes, `${file.url}: stale size`);
  if (file.format === 'pdf') assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  else {
    assert.equal(bytes.subarray(0, 4).toString('hex'), '504b0304');
    const member = file.format === 'docx' ? 'word/document.xml' : 'xl/workbook.xml';
    assert.ok(bytes.includes(Buffer.from(member)), `${file.url}: invalid Office document`);
  }
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.url}: changed bytes`);
}

export function validateDocumentFiles(root = defaultRoot) {
  assert.equal(documentFilesByUrl.size, documentFiles.length, 'Duplicate document URL');
  documentFiles.forEach(file => validateDocumentFile(file, root));
}
