import type { APIRoute } from 'astro';
import { createFromSource } from 'fumadocs-core/search/server';
import { getStructuredData, enSource } from '@/lib/source';

const server = createFromSource(enSource, {
  buildIndex(page) {
    return {
      id: page.data._raw.id,
      title: page.data.title,
      description: page.data.description,
      structuredData: getStructuredData(page.data._raw),
      url: page.url,
    };
  },
});

export const GET: APIRoute = () => {
  return server.staticGET();
};
