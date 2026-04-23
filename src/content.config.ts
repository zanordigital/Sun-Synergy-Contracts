import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    duration: z.string(),
    featured: z.boolean(),
    images: z.number(),
    folderName: z.string(),
  }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs.yaml'),
  schema: z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    location: z.string().optional(),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/locations' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

export const collections = { projects, faqs, services, locations };
