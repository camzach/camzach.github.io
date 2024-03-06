import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
});

const portfolio = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    banner: z.string(),
    showcase: z.string().optional(),
  }),
});

export const collections = { blog, portfolio };
