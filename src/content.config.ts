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
    // Section 3 extensions
    year: z.number().optional(),
    city: z.enum(['Petaling Jaya', 'Subang Jaya', 'USJ', 'Puchong', 'Kuala Lumpur', 'Shah Alam', 'Klang', 'Cyberjaya', 'Kajang']).optional(),
    neighbourhood: z.string().optional(),
    services: z.array(z.enum(['home-renovation', 'interior-design', 'commercial-renovation', 'kitchen-cabinetry', 'swimming-pool-construction', 'landscape-design'])).optional(),
    propertyType: z.enum(['terrace', 'condo', 'semi-d', 'bungalow', 'shoplot', 'office', 'government', 'other']).optional(),
    scopeBullets: z.array(z.string()).optional(),
    testimonial: z.object({ quote: z.string(), clientInitial: z.string() }).optional(),
    body: z.string().optional(),
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
    slug: z.string(),
    title: z.string(),
    h1: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    heroSubhead: z.string(),
    primaryKeyword: z.string(),
    description: z.string(),
    priceFromMYR: z.number().optional(),
    priceCeilingMYR: z.number().optional(),
    problems: z.array(z.string()),
    processSteps: z.array(z.object({ title: z.string(), detail: z.string() })),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    relatedProjectSlugs: z.array(z.string()).optional(),
    relatedAreaSlugs: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/locations' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    h1: z.string(),
    heroSubhead: z.string(),
    description: z.string(),
    relatedProjectSlugs: z.array(z.string()).optional(),
    relatedServiceSlugs: z.array(z.string()).optional(),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    mapEmbedSrc: z.string().optional(),
    heroImage: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    metaDescription: z.string(),
    publishDate: z.coerce.date(),
    author: z.string().optional().default('Sun Synergy Contracts'),
    heroImage: z.string().optional(),
    category: z.enum(['renovation-tips', 'interior-design', 'project-showcase', 'cost-guide', 'contractor-advice']),
    tags: z.array(z.string()).optional(),
    excerpt: z.string(),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { projects, faqs, services, locations, blog };
