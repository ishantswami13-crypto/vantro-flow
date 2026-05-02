import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  jsonb,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact_name: text("contact_name"),
  email: text("email"),
  business_type: text("business_type"),
  company_scale: text("company_scale"),
  selected_modules: text("selected_modules"),
  onboarding_completed: boolean("onboarding_completed").default(false),
  onboarding_completed_at: timestamp("onboarding_completed_at"),
  gst_number: text("gst_number"),
  city: text("city"),
  state: text("state"),
  plan: varchar("plan", { length: 20 }).default("starter"),
  plan_expires_at: timestamp("plan_expires_at", { withTimezone: true }),
  trial_ends_at: timestamp("trial_ends_at", { withTimezone: true }).default(sql`NOW() + INTERVAL '30 days'`),
  customer_count_limit: integer("customer_count_limit").default(5),
  created_at: timestamp("created_at").defaultNow(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull().unique(),
  price_monthly: integer("price_monthly").notNull(),
  price_annual: integer("price_annual").notNull(),
  customer_limit: integer("customer_limit"),
  features: jsonb("features").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp_number: text("whatsapp_number"),
  email: text("email"),
  city: text("city"),
  total_outstanding: numeric("total_outstanding", { precision: 12, scale: 2 }).default("0"),
  avg_payment_delay_days: integer("avg_payment_delay_days").default(0),
  preferred_language: text("preferred_language").default("hinglish"),
  status: text("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  customer_id: integer("customer_id").references(() => customers.id),
  invoice_number: text("invoice_number").notNull(),
  invoice_date: date("invoice_date"),
  due_date: date("due_date"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  amount_paid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0"),
  status: text("status").default("unpaid"),
  days_overdue: integer("days_overdue").default(0),
  aging_bucket: text("aging_bucket").default("current"),
  is_disputed: boolean("is_disputed").default(false),
  dispute_reason: text("dispute_reason"),
  created_at: timestamp("created_at").defaultNow(),
});

export const payment_promises = pgTable("payment_promises", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  customer_id: integer("customer_id").references(() => customers.id),
  invoice_id: integer("invoice_id").references(() => invoices.id),
  promised_amount: numeric("promised_amount", { precision: 12, scale: 2 }),
  promised_date: date("promised_date"),
  promised_via: text("promised_via"),
  notes: text("notes"),
  status: text("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

export const follow_ups = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  customer_id: integer("customer_id").references(() => customers.id),
  invoice_id: integer("invoice_id").references(() => invoices.id),
  activity_type: text("activity_type").notNull(),
  message_text: text("message_text"),
  performed_at: timestamp("performed_at").defaultNow(),
});

export const plan_events = pgTable("plan_events", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  event_type: varchar("event_type", { length: 50 }).notNull(),
  from_plan: varchar("from_plan", { length: 20 }),
  to_plan: varchar("to_plan", { length: 20 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payments_received = pgTable("payments_received", {
  id: serial("id").primaryKey(),
  invoice_id: integer("invoice_id").references(() => invoices.id),
  organization_id: integer("organization_id").references(() => organizations.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  payment_date: date("payment_date").notNull(),
  payment_mode: varchar("payment_mode", { length: 20 }).default("upi"),
  reference_number: varchar("reference_number", { length: 100 }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  contact_name: varchar("contact_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  category: varchar("category", { length: 100 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  vendor_id: integer("vendor_id").references(() => vendors.id),
  title: varchar("title", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  due_date: date("due_date"),
  paid_date: date("paid_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  category: varchar("category", { length: 100 }),
  recurring: boolean("recurring").default(false),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  hsn_code: varchar("hsn_code", { length: 20 }),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  cost_price: numeric("cost_price", { precision: 12, scale: 2 }),
  selling_price: numeric("selling_price", { precision: 12, scale: 2 }),
  reorder_level: integer("reorder_level").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id),
  organization_id: integer("organization_id").references(() => organizations.id),
  quantity: integer("quantity").default(0),
  last_updated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const nova_briefings = pgTable(
  "nova_briefings",
  {
    id: serial("id").primaryKey(),
    organization_id: integer("organization_id").references(() => organizations.id),
    briefing_date: date("briefing_date").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    health_score: integer("health_score"),
    critical_count: integer("critical_count").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("nova_briefings_org_date_idx").on(t.organization_id, t.briefing_date)],
);

export const health_scores = pgTable(
  "health_scores",
  {
    id: serial("id").primaryKey(),
    organization_id: integer("organization_id").references(() => organizations.id),
    score: integer("score").notNull(),
    components: jsonb("components").$type<Record<string, number>>().notNull(),
    score_date: date("score_date").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("health_scores_org_date_idx").on(t.organization_id, t.score_date)],
);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  type: varchar("type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  action_url: varchar("action_url", { length: 500 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
