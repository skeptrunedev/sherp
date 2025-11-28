import { defineCollection, z } from 'astro:content';
import { presentationsLoader } from './loader';

const presentations = defineCollection({
  loader: presentationsLoader(),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    paginate: z.boolean().default(false),
    size: z.string().optional(),
    math: z.string().optional(),
  }),
});

export const collections = {
  presentations,
};
