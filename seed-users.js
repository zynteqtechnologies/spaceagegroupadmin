// seed-users.js — Seeds an administrator and a manager user into Turso
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const client = createClient({
  url: 'libsql://spaceagegroup-zahid5104.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxODU0MDIsImlkIjoiMDE5ZjY5YmMtNTAwMS03MDZmLWJlMjUtYmI0ZmMxYWFmMzkwIiwia2lkIjoidG9BV3laX01HejBmQTBKV2t5bjBrOTJKSU5EWXg5eUVsNnhPM2kwcXgyOCIsInJpZCI6ImNmZDNjZGNhLWU1NzUtNDBiZS05NmU2LTg5MjBlMTM2ZjE5MyJ9.a9leNYDFEUVPDOv8Jj6VirGnP7bu1zkcbXD8ZGJsA4mzaYAYYld44NpYtjZZdztw6InrVT8_59n0AMX4Y0AnCg',
});

// ── Configure seed users here ─────────────────────────────────────────────────
const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@spaceagegroup.com',
    password: 'Admin@12345',
    role: 'administrator',
  },
  {
    name: 'Manager User',
    email: 'manager@spaceagegroup.com',
    password: 'Manager@12345',
    role: 'manager',
  },
];
// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding users into Turso...\n');

  for (const user of SEED_USERS) {
    // Check if the user already exists
    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [user.email],
    });

    if (existing.rows.length > 0) {
      console.log(`⚠️  Skipping "${user.email}" — already exists.`);
      continue;
    }

    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, user.name, user.email, hashedPassword, user.role, now, now],
    });

    console.log(`✅  Created [${user.role}] "${user.name}" <${user.email}>`);
    console.log(`    Password : ${user.password}`);
    console.log(`    UUID     : ${id}\n`);
  }

  console.log('🎉 Seeding complete!');
  console.log('\nYou can now log in at http://localhost:3000/login with the credentials above.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
