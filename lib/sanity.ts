import { createClient } from "next-sanity"

export const client = createClient({
  projectId: "your-project-id",
  dataset: "production",
  apiVersion: "2021-10-21",
  useCdn: false,
})

