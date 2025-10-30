import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

import * as schema from "./schema";

const connectionString = env.LLM_CONNECTION_STRING || "";

const client = postgres(connectionString);

export const db = drizzle(client, {
  casing: "snake_case",
  schema,
});
