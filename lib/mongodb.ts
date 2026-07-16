// lib/mongodb.ts
// Bridge/Mock to ease Turso Drizzle migration without changing imports
import { connectDB as dbConnect } from './db';
export const connectDB = dbConnect;