import { docs } from "collections/server"
import { loader } from "fumadocs-core/source"

// Create a typed page source for the public docs route.
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})
