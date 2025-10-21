"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";

// Usando Google Gemini (gratuito)
const google = process.env.GOOGLE_AI_API_KEY
  ? createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    })
  : null;

interface AIChatResponse {
  response: string;
  executionTime: number;
}

async function aiChatAction(
  user: { id: string; email?: string },
  supabase: SupabaseClient,
  question: string,
): Promise<ActionsResponse<AIChatResponse>> {
  const startTime = Date.now();
  console.log("Recebida pergunta AI:", question);

  try {
    if (!question.trim()) {
      return {
        success: false,
        error: "Pergunta não pode estar vazia",
      };
    }

    // Verificar se a API key está configurada
    if (!google) {
      return {
        success: false,
        error:
          "Funcionalidade de IA não configurada. Configure a GOOGLE_AI_API_KEY no arquivo .env",
      };
    }

    // Contexto específico para o sistema de orçamentos
    const systemPrompt = `
    Você é um assistente de análise de dados para uma oficina automotiva que usa um sistema de gestão.
    
    O sistema possui as seguintes funcionalidades:
    - Gestão de orçamentos (quotes) com dados de cliente, veículo e serviços
    - Controle de transações financeiras (receitas e despesas)
    - Gestão de funcionários e cargos
    - Categorização de transações
    - Relatórios e dashboard
    
    Estrutura do banco de dados disponível:
    - Tabela 'quotes': orçamentos com cliente, veículo, serviços e valores
    - Tabela 'transactions': transações financeiras categorizadas
    - Tabela 'employees': funcionários e seus cargos
    - Tabela 'categories': categorias de transações
    - Tabela 'roles': cargos dos funcionários
    
    IMPORTANTE: Você NÃO tem acesso direto ao banco de dados. Apenas forneça insights e sugestões baseadas no contexto do negócio.
    
    Responda de forma clara e profissional em português brasileiro. Se a pergunta for sobre dados específicos, 
    explique que seria necessário consultar o banco de dados e sugira como essa informação poderia ser obtida.
    `;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"), // Modelo gratuito do Google
      system: systemPrompt,
      prompt: question,
      temperature: 0.3,
    });

    return {
      success: true,
      data: {
        response: text,
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("Erro na geração de resposta AI:", error);

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

// Função wrapper para usar com withAuth
export async function sendAiChatMessage(
  question: string,
): Promise<ActionsResponse<AIChatResponse>> {
  return withAuth(aiChatAction, question);
}
