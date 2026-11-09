import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Run the exact TypeScript helper without requiring another test runner.
const source=readFileSync(new URL('../src/pdfCitations.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
new Function('exports',compiled)(exports);
const {preparePdfCitations,stripLegacySourceList,citationExcerptsFromContext}=exports;
const context='Document: Notes.pdf (10 PDF pages).\nRetrieved excerpts:\n[PDF page 7] The theorem on spectral sequences lives here.\n\n[PDF page 3] Background definition.';

test('retrieved PDF pages are parsed correctly',()=>{
 assert.deepEqual([...citationExcerptsFromContext(context).keys()],[7,3]);
});
test('wrong external web link on PDF page label is rewritten to internal citation',()=>{
 const answer='See [PDF page 7](https://minhpham2003.github.io/math-reading-agent/previews/ai-chat/?v=3a5220c).';
 assert.equal(preparePdfCitations(answer,context),'See [PDF page 7](pdf-page:7).');
});
test('unsupported websites are not linked as PDF citations',()=>{
 assert.equal(preparePdfCitations('See [Theorem 0.6](https://example.org).',context),'See Theorem 0.6.');
});
test('unretrieved PDF page cannot be linked',()=>{
 assert.equal(preparePdfCitations('See [PDF page 20](pdf-page:20).',context),'See PDF page 20.');
});
test('bare supported page mention becomes internal citation',()=>{
 assert.equal(preparePdfCitations('Refer to PDF page 7.',context),'Refer to [PDF page 7](pdf-page:7).');
});
test('verified quote is preserved, fabricated quote is downgraded to page-only',()=>{
 assert.equal(preparePdfCitations('[theorem](pdf-page:7?quote=the%20theorem%20on%20spectral%20sequences)',context),
   '[theorem](pdf-page:7?quote=the%20theorem%20on%20spectral%20sequences)');
 assert.equal(preparePdfCitations('[theorem](pdf-page:7?quote=not%20in%20the%20source)',context),
   '[theorem](pdf-page:7)');
});
test('unrelated automatic PDF sources lists are removed, including from old replies',()=>{
 const message='A supported claim.\n\nPDF sources: [p. 7](pdf-page:7) · [p. 3](pdf-page:3)';
 assert.equal(stripLegacySourceList(message),'A supported claim.');
 assert.equal(preparePdfCitations(message,context),'A supported claim.');
});
test('do not link phrases in code blocks',()=>{
 assert.equal(preparePdfCitations('`PDF page 7` and PDF page 7',context),
  '`PDF page 7` and [PDF page 7](pdf-page:7)');
 assert.equal(preparePdfCitations('```text\nPDF page 7\n```',context),
  '```text\nPDF page 7\n```');
});

test('a passage quote containing literal parentheses is fully consumed',()=>{
 const src='[PDF page 7] Definition 1.1 A (homological) spectral sequence consists of data E and d.';
 const source='Document: Notes.pdf.\nRetrieved excerpts:\n'+src;
 const message='See [Definition 1.1](pdf-page:7?quote=Definition%201.1%20A%20(homological)%20spectral%20sequence) now.';
 assert.equal(preparePdfCitations(message,source),
  'See [Definition 1.1](pdf-page:7?quote=Definition%201.1%20A%20%28homological%29%20spectral%20sequence) now.');
});
