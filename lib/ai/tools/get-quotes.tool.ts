import { tool } from "ai";
import z from "zod";

import { getQuotes } from "../actions/get-quotes.action";

export const getQuotesTool = tool({
  description: `
          Busca orçamentos com filtros flexíveis.
          Use para: "orçamentos da Maria", "orçamentos deste mês", 
          "orçamentos acima de R$ 1000", "orçamentos de janeiro".
          Sempre pedir para o usuário se ele deseja que os serviços sejam exibidos junto.
        `,
  inputSchema: z.object({
    client_name: z
      .string()
      .optional()
      .describe("Nome do cliente (ex: 'Maria Silva')"),

    period: z
      .string()
      .optional()
      .describe(
        "Período: 'este mês', 'mês passado', 'últimos 7 dias', 'janeiro 2025'",
      ),

    min_value: z
      .number()
      .optional()
      .describe("Valor mínimo em REAIS (já convertido, ex: 1000 para R$ 1000)"),

    max_value: z
      .number()
      .optional()
      .describe("Valor máximo em REAIS (ex: 5000 para R$ 5000)"),

    vehicle_filter: z
      .string()
      .optional()
      .describe(
        "Marca, modelo, cor ou ano do veículo (ex: 'Honda', 'Civic', 'vermelho')",
      ),

    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Máximo de resultados"),
  }),

  execute: async (params) => {
    console.log("Executando getQuotes com params:", params);

    try {
      const result = await getQuotes(params);
      return result;
    } catch (error) {
      console.error("Erro em getQuotesTool:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        count: 0,
        quotes: [],
      };
    }
  },
});
