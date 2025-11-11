import { defineCollection, z } from 'astro:content';

const presentations = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    theme: z.string().default('default'),
    paginate: z.boolean().default(false),
    size: z.string().optional(),
    math: z.string().optional(),
  }),
});

export const collections = {
  presentations,
};
