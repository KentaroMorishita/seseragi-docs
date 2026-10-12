import type { StaticSource } from 'fumadocs-core/source';
import { loader } from 'fumadocs-core/source';
import { type CollectionEntry, getCollection } from 'astro:content';
import * as path from 'node:path';
import { structure, type StructuredData } from 'fumadocs-core/mdx-plugins';

export const source = loader({
  source: await createMySource('docs', 'meta', 'content/docs'),
  baseUrl: '/docs',
});

export const enSource = loader({ source: await createMySource('docsEn', 'metaEn', 'content/en'), baseUrl: '/en/docs' });

export function getStructuredData(entry: CollectionEntry<'docs'> | CollectionEntry<'docsEn'>): StructuredData {
  return structure(entry.body ?? "");
}

async function createMySource(docs: 'docs' | 'docsEn', metaCollection: 'meta' | 'metaEn', base: string) {
  const out: StaticSource<{
    metaData: CollectionEntry<'meta'>['data'];
    pageData: CollectionEntry<'docs'>['data'] & {
      _raw: CollectionEntry<'docs'> | CollectionEntry<'docsEn'>;
    };
  }> = {
    files: [],
  };

  for (const page of await getCollection(docs)) {
    const virtualPath = path.relative(base, page.filePath!);

    out.files.push({
      type: 'page',
      path: virtualPath,
      data: {
        ...page.data,
        _raw: page,
      },
    });
  }

  for (const meta of await getCollection(metaCollection)) {
    const virtualPath = path.relative(base, meta.filePath!);

    out.files.push({
      type: 'meta',
      path: virtualPath,
      data: meta.data,
    });
  }

  return out;
}
