import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { db } from '../db'
import { organizations } from '../db/schema'
import { eq } from 'drizzle-orm'

async function test() {
  console.log('Testing Drizzle query...')
  try {
    const rows = await db.select().from(organizations).where(eq(organizations.id, 1)).limit(1)
    console.log('Result:', JSON.stringify(rows, null, 2))
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
