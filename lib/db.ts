// lib/db.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

export const db = drizzle(client, { schema });

// Mock connectDB helper to avoid breaking existing import and await calls
export async function connectDB() {
  return db;
}

export default connectDB;