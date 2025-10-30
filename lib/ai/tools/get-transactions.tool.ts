import { tool } from "ai";
import z from "zod";

import { getTransactions } from "../actions/get-transactions.action";

export const getTransactionsTool = tool({
  description: `
          Busca transações com filtros flexíveis.
          O usuário precisa sempre fornecer um limite de resultados. Esse limite deve ser de no máximo 50 resultados. Caso precise de mais resultados, oriente o usuário a refinar os filtros.
          Caso não forneça um limite de resultados, utilize o valor padrão de 50 resultados.
          Filtre por nome, categoria, tipo, período e valores mínimo/máximo.
          Use para:"transações deste mês", 
          "transações acima de R$ 1000", "transações de janeiro".
        `,
  inputSchema: z.object({
    transaction_name: z
      .string()
      .optional()
      .describe("Nome da transação (ex: 'Compra de materiais')"),
    transaction_category: z
      .string()
      .optional()
      .describe("Categoria da transação (ex: 'Alimentação', 'Transporte')"),
    transaction_type: z
      .enum(["income", "expense"])
      .optional()
      .describe("Tipo da transação (ex: 'Entrada', 'Saída')"),

    period: z
      .string()
      .optional()
      .describe("Período das transações (ex: 'janeiro', 'últimos 30 dias')"),

    min_value: z
      .number()
      .min(0)
      .optional()
      .describe(
        "Valor mínimo das transações (ex: 1000) se esse valor vier em reais, converta para centavos",
      ),

    max_value: z
      .number()
      .min(0)
      .optional()
      .describe(
        "Valor máximo das transações (ex: 5000) se esse valor vier em reais, converta para centavos",
      ),
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(50)
      .describe("Número máximo de resultados a serem retornados (máx 50)"),
  }),
  execute: async (params) => {
    console.log("getTransactionsTool params:", params);

    const result = await getTransactions(params);

    if (result.success && result.data && result?.data?.length > 0) {
      return result.data;
    }

    return result;
  },
});
