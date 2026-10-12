// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import {
  rehypeCode,
  remarkCodeTab,
  remarkHeading,
  remarkNpm,
  remarkStructure,
} from 'fumadocs-core/mdx-plugins';

/** @type {import('@astrojs/markdown-remark').RemarkPlugins} */
const remarkPlugins = [
  remarkHeading,
  remarkCodeTab,
  remarkNpm,
  [remarkStructure, { exportAs: 'structuredData' }],
];
const grammar = JSON.parse(readFileSync(new URL('./src/lib/seseragi.tmLanguage.json', import.meta.url), 'utf8'));
/** @type {import('@astrojs/markdown-remark').RehypePlugins} */
const rehypePlugins = [[rehypeCode, { langs: [{ ...grammar, name: 'seseragi', aliases: ['ssrg'] }] }]];

export default defineConfig({
  site: 'https://seseragi-docs-site.vercel.app',
  markdown: {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
    }),
  },
  integrations: [
    react(),
    mdx({
      extendMarkdownConfig: true,
      syntaxHighlight: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
