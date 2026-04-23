import { config, collection, fields, singleton } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },

  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'name',
      path: 'src/content/projects/*',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Project Name' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        duration: fields.text({ label: 'Duration (e.g. 7 months)' }),
        featured: fields.checkbox({ label: 'Show on homepage', defaultValue: false }),
        images: fields.integer({ label: 'Number of images' }),
        folderName: fields.text({ label: 'Image folder name (must match exact folder name in public/img/projects/)' }),
      },
    }),
  },

  singletons: {
    faqs: singleton({
      label: 'FAQs',
      path: 'src/content/faqs',
      format: { data: 'yaml' },
      schema: {
        items: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
          }),
          { label: 'FAQ Items', itemLabel: (props) => props.fields.question.value ?? 'FAQ' }
        ),
      },
    }),
  },
});
