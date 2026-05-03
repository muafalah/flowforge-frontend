import { defineConfig } from "orval";
import { loadEnv } from "vite";

const env = loadEnv("", process.cwd());
const apiUrl = env.VITE_API_URL || "http://localhost:3000";

export default defineConfig({
  api: {
    input: `${apiUrl}/api-docs-json`,
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/models",
      client: "react-query",
      prettier: true,
      override: {
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
