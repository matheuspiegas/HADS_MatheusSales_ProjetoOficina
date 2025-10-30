"use server";

import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { quotesSchema } from "@/lib/db/schema";

import { parsePeriod } from "../helpers";

interface GetQuotesParams {
  client_name?: string;
  vehicle_filter?: string;
  period?: string;
  min_value?: number;
  max_value?: number;
  limit?: number;
}

export async function getQuotes(params: GetQuotesParams) {
  const {
    max_value,
    min_value,
    period,
    vehicle_filter,
    client_name,
    limit = 50,
  } = params;

  console.log("getQuotesAction params:", params);

  try {
    // Construir condições de filtro
    const conditions = [];

    // FILTRO: Cliente
    if (client_name) {
      conditions.push(ilike(quotesSchema.clientName, `%${client_name}%`));
    }

    // FILTRO: Período
    if (period) {
      const parsedPeriod = parsePeriod(period);
      console.log("Parsed period:", parsedPeriod);
      if (parsedPeriod.start) {
        conditions.push(
          gte(quotesSchema.createdAt, new Date(parsedPeriod.start)),
        );
      }
      if (parsedPeriod.end) {
        conditions.push(
          lte(quotesSchema.createdAt, new Date(parsedPeriod.end)),
        );
      }
    }

    // FILTRO: Valores (converter de R$ para centavos)
    if (min_value !== undefined) {
      conditions.push(
        gte(quotesSchema.totalPrice, (min_value * 100).toString()),
      );
    }

    if (max_value !== undefined) {
      conditions.push(
        lte(quotesSchema.totalPrice, (max_value * 100).toString()),
      );
    }

    // FILTRO: Veículo
    if (vehicle_filter) {
      conditions.push(
        or(
          ilike(quotesSchema.vehicleBrand, `%${vehicle_filter}%`),
          ilike(quotesSchema.vehicleModel, `%${vehicle_filter}%`),
          ilike(quotesSchema.vehicleYear, `%${vehicle_filter}%`),
          ilike(quotesSchema.vehicleColor, `%${vehicle_filter}%`),
        ),
      );
    }

    const query = db.query.quotesSchema.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { services: true },
      orderBy: desc(quotesSchema.createdAt),
      limit,
    });

    const data = await query;

    if (data && data.length !== 0) {
      const formatted = data.map((q) => {
        const services = q.services || [];
        return {
          ...q,
          totalPriceFormatted: `R$ ${(Number(q.totalPrice) / 100).toFixed(2)}`,
          servicesCount: services.length,
          servicesTotal: services.reduce(
            (acc, service) => acc + Number(service.price),
            0,
          ),
        };
      });

      return {
        success: true,
        count: formatted.length,
        quotes: formatted,
        summary: {
          total_value: formatted.reduce(
            (sum: number, q: any) => sum + Number(q.total_price) / 100,
            0,
          ),
          filters_applied: {
            client_name,
            period,
            min_value,
            max_value,
            vehicle_filter,
          },
        },
      };
    }

    return {
      success: true,
      count: 0,
      quotes: [],
      message: "Nenhum orçamento encontrado com os filtros fornecidos.",
      summary: {
        total_value: 0,
        filters_applied: {
          client_name,
          period,
          min_value,
          max_value,
          vehicle_filter,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return {
      success: false,
      error: `Erro ao buscar orçamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      count: 0,
      quotes: [],
    };
  }
}
