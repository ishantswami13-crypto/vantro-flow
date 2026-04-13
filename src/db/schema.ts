import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  business_type: text("business_type"),
  gst_number: text("gst_number"),
  city: text("city"),
  state: text("state"),
  plan: text("plan").default("free"),
  created_at: timestamp("created_at").defaultNow(),
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
