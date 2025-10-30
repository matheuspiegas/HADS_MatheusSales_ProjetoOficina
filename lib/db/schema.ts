import { relations } from "drizzle-orm";
import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Schema da tabela transactions
export const transactionsSchema = pgTable("transactions", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: numeric("amount").notNull(),
  transactionDate: date("transaction_date").notNull(),
  transactionCategoryId: uuid("transaction_category_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema da tabela transaction_categories
export const transactionCategoriesSchema = pgTable("transaction_categories", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotesSchema = pgTable("quotes", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientCpf: text("client_cpf"),
  clientAddress: text("client_address"),
  vehicleModel: text("vehicle_model"),
  vehicleBrand: text("vehicle_brand"),
  vehicleColor: text("vehicle_color"),
  vehicleYear: text("vehicle_year"),
  vehicleChassi: text("vehicle_chassi"),
  vehicleLicensePlate: text("vehicle_license_plate"),
  totalPrice: numeric("total_price").notNull(),
  observations: text("observations"),
});

export const servicesSchema = pgTable("services", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotesSchema.id),
});

export const quotesRelations = relations(quotesSchema, ({ many }) => ({
  services: many(servicesSchema),
}));

export const servicesRelations = relations(servicesSchema, ({ one }) => ({
  quote: one(quotesSchema, {
    fields: [servicesSchema.quoteId],
    references: [quotesSchema.id],
  }),
}));

// Relations: transactions <-> transaction_categories
export const transactionsRelations = relations(
  transactionsSchema,
  ({ one }) => ({
    category: one(transactionCategoriesSchema, {
      fields: [transactionsSchema.transactionCategoryId],
      references: [transactionCategoriesSchema.id],
    }),
  }),
);

export const transactionCategoriesRelations = relations(
  transactionCategoriesSchema,
  ({ many }) => ({
    transactions: many(transactionsSchema),
  }),
);
