import { db } from "./index";
import { organizations } from "./schema";

async function seed() {
  const existing = await db.select().from(organizations).limit(1);
  if (existing.length > 0) {
    console.log("Default org already exists, skipping seed.");
    return;
  }
  await db.insert(organizations).values({
    id: 1,
    name: "Demo Business",
    contact_name: "Workspace Owner",
    email: "owner@example.com",
    business_type: "distributor",
    city: "Delhi",
    state: "Delhi",
    plan: "starter",
    customer_count_limit: 5,
  });
  console.log("Seeded default organization (id=1): Demo Business, Delhi.");
}

seed().catch(console.error);
