import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'http://localhost:3000/api-json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      prettier: true,
      override: {
        mutator: {
          // You can specify a custom axios instance here if needed
          // path: './src/api/custom-instance.ts',
          // name: 'customInstance',
        },
      },
    },
  },
});
