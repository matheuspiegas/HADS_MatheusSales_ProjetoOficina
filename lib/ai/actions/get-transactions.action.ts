"use server";

import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import {
  transactionCategoriesSchema,
  transactionsSchema,
} from "@/lib/db/schema";

import { parsePeriod } from "../helpers";

interface GetTransactionsParams {
  transaction_name?: string;
  transaction_category?: string;
  transaction_type?: "income" | "expense";
  period?: string;
  min_value?: number;
  max_value?: number;
  limit?: number;
}

export async function getTransactions(params: GetTransactionsParams) {
  const {
    max_value,
    min_value,
    period,
    transaction_category,
    transaction_name,
    transaction_type,
    limit = 50,
  } = params;

  console.log("getTransactionsAction params:", params);

  try {
    // Construir condições de filtro
    const conditions = [];

    if (transaction_name) {
      conditions.push(ilike(transactionsSchema.name, `%${transaction_name}%`));
    }

    if (transaction_type) {
      conditions.push(eq(transactionsSchema.type, transaction_type));
    }

    if (min_value !== undefined) {
      // Converter reais para centavos
      conditions.push(
        gte(transactionsSchema.amount, (min_value * 100).toString()),
      );
    }

    if (max_value !== undefined) {
      // Converter reais para centavos
      conditions.push(
        lte(transactionsSchema.amount, (max_value * 100).toString()),
      );
    }

    if (period) {
      const parsedPeriod = parsePeriod(period);
      console.log("Parsed period:", parsedPeriod);
      if (parsedPeriod.start) {
        conditions.push(
          gte(transactionsSchema.transactionDate, parsedPeriod.start),
        );
      }
      if (parsedPeriod.end) {
        conditions.push(
          lte(transactionsSchema.transactionDate, parsedPeriod.end),
        );
      }
    }

    // Filtro adicional por nome da categoria
    if (transaction_category) {
      conditions.push(
        ilike(transactionCategoriesSchema.name, `%${transaction_category}%`),
      );
    }

    // Query usando Relational Query API do Drizzle
    const query = db.query.transactionsSchema.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { category: true },
      orderBy: desc(transactionsSchema.transactionDate),
      limit,
    });

    const data = await query;

    console.log("getTransactionsAction data:", data);

    if (data && data.length !== 0) {
      const formatted = data.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        amount: Number(t.amount) / 100, // Converter centavos para reais
        transaction_date: t.transactionDate,
        category: t.category
          ? {
              id: t.category.id,
              name: t.category.name,
            }
          : null,
        created_at: t.createdAt,
      }));

      return {
        success: true,
        count: formatted.length,
        data: formatted,
      };
    }

    return {
      success: true,
      count: 0,
      data: [],
      message: "Nenhuma transação encontrada com os filtros fornecidos.",
    };
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return {
      success: false,
      error: `Erro ao buscar transações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      count: 0,
      data: [],
    };
  }
}
