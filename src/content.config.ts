import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";
const docsSchema = z.object({ title: z.string(), description: z.string().optional(), icon: z.string().optional() });
const metaSchema = z.object({ title: z.string().optional(), description: z.string().optional(), pages: z.array(z.string()).optional(), icon: z.string().optional() });
export const collections = {
  docs: defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/docs" }), schema: docsSchema }),
  meta: defineCollection({ loader: glob({ pattern: "**/*.{json,yaml}", base: "./content/docs" }), schema: metaSchema }),
  docsEn: defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/en" }), schema: docsSchema }),
  metaEn: defineCollection({ loader: glob({ pattern: "**/*.{json,yaml}", base: "./content/en" }), schema: metaSchema }),
};
