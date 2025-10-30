/**
 * Analisa uma string de período em linguagem natural e a converte em um objeto com datas de início e/alvo.
 * A função é projetada para ser flexível e entender uma variedade de formatos de data comuns em português.
 *
 * @param {string} period - A string de período em linguagem natural a ser analisada. A análise não diferencia maiúsculas de minúsculas.
 * @returns {{ start?: string; end?: string }} Um objeto contendo as datas de início (`start`) e/ou fim (`end`) como strings no formato ISO.
 * Se a string do período não for reconhecida, um objeto vazio é retornado e um aviso é logado no console.
 *
 * @example
 * // Retorna o início de 5 dias atrás até agora
 * parsePeriod("últimos 5 dias");
 *
 * @example
 * // Retorna o início e o fim do dia de ontem
 * parsePeriod("ontem");
 *
 * @example
 * // Retorna o início e o fim do mês de Janeiro do ano corrente
 * parsePeriod("janeiro");
 *
 * @example
 * // Retorna o início e o fim do mês de Fevereiro de 2023
 * parsePeriod("fevereiro de 2023");
 *
 * @example
 * // Retorna o início e o fim do ano de 2024
 * parsePeriod("ano de 2024");
 *
 * @description
 * A função processa a string de entrada através de uma série de estratégias e padrões:
 *
 * 1. **Padrões Numéricos ("últimos X ..."):**
 *    - **"últimos X dias"**: Calcula a data de início `X` dias antes da data atual. O `end` não é definido.
 *      Ex: `parsePeriod("últimos 7 dias")`
 *    - **"últimos X meses"**: Calcula a data de início `X` meses antes da data atual. O `end` não é definido.
 *      Ex: `parsePeriod("últimos 2 meses")`
 *    - **"últimos X anos"**: Calcula a data de início `X` anos antes da data atual. O `end` não é definido.
 *      Ex: `parsePeriod("último ano")` (funciona para "1 ano")
 *
 * 2. **Casos Especiais Comuns:**
 *    - **"hoje"**: Define `start` para o início do dia atual (00:00:00). `end` não é definido.
 *    - **"ontem"**: Define `start` para o início de ontem (00:00:00) e `end` para o final de ontem (23:59:59.999).
 *    - **"esta semana" / "dessa semana"**: Define `start` para o início do primeiro dia (Domingo) da semana atual. `end` não é definido.
 *
 * 3. **Padrões de Mês:**
 *    - **"este mês" / "deste mês"**: Define `start` para o primeiro dia do mês atual. `end` não é definido.
 *    - **"mês passado" / "último mês"**: Define `start` para o primeiro dia do mês anterior e `end` para o último dia do mês anterior.
 *
 * 4. **Nomes de Meses Específicos:**
 *    - Procura por nomes de meses (ex: "janeiro", "fevereiro").
 *    - Se um ano de 4 dígitos for encontrado na string (ex: "janeiro de 2023"), esse ano é usado.
 *    - Se nenhum ano for encontrado, o ano atual é assumido.
 *    - Define `start` para o primeiro dia do mês/ano e `end` para o último dia do mesmo.
 *
 * 5. **Ano Específico:**
 *    - Procura por um ano de 4 dígitos (começando com "202", ex: "2024").
 *    - Define `start` para o primeiro dia do ano (1 de Janeiro) and `end` para o último dia do ano (31 de Dezembro).
 *
 * 6. **Fallback (Nenhum Padrão Reconhecido):**
 *    - Se a string `period` não corresponder a nenhum dos padrões acima, a função loga um aviso no console.
 *    - Retorna um objeto vazio `{}`, indicando que nenhum filtro de data deve ser aplicado.
 */
export function parsePeriod(period: string): { start?: string; end?: string } {
  const now = new Date();
  const periodLower = period.toLowerCase().trim();

  // 🔥 ESTRATÉGIA: Tentar extrair NÚMEROS primeiro (mais flexível)

  // 1️⃣ Padrão: "últimos X dias/meses/anos"
  const daysMatch = periodLower.match(/últimos?\s+(\d+)\s+dias?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return {
      start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      end: undefined,
    };
  }

  const monthsMatch = periodLower.match(/últimos?\s+(\d+)\s+mes(?:es)?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months,
      now.getDate(),
    );
    return {
      start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      end: undefined,
    };
  }

  const yearsMatch = periodLower.match(/últimos?\s+(\d+)\s+anos?/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    const startDate = new Date(
      now.getFullYear() - years,
      now.getMonth(),
      now.getDate(),
    );
    return {
      start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      end: undefined,
    };
  }

  // 2️⃣ Casos especiais comuns
  if (periodLower.includes("hoje")) {
    return {
      start: now.toISOString().split("T")[0], // YYYY-MM-DD
      end: undefined,
    };
  }

  if (periodLower.includes("ontem")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];
    return {
      start: yesterdayDate,
      end: yesterdayDate,
    };
  }

  if (
    periodLower.includes("esta semana") ||
    periodLower.includes("dessa semana")
  ) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return {
      start: startOfWeek.toISOString().split("T")[0], // YYYY-MM-DD
      end: undefined,
    };
  }

  // 3️⃣ Padrões de mês
  if (periodLower.includes("este mês") || periodLower.includes("deste mês")) {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      end: undefined,
    };
  }

  if (
    periodLower.includes("mês passado") ||
    periodLower.includes("último mês")
  ) {
    const startDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - 1, 1),
    );
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0));

    return {
      start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      end: endDate.toISOString().split("T")[0], // YYYY-MM-DD
    };
  }

  // 4️⃣ Meses específicos por nome
  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  for (let i = 0; i < monthNames.length; i++) {
    if (periodLower.includes(monthNames[i])) {
      const yearMatch = periodLower.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear();

      // Criar data de início: primeiro dia do mês
      const startDate = new Date(Date.UTC(year, i, 1));

      // Criar data de fim: último dia do mês
      const endDate = new Date(Date.UTC(year, i + 1, 0));

      return {
        start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
        end: endDate.toISOString().split("T")[0], // YYYY-MM-DD
      };
    }
  }

  // 5️⃣ Ano específico
  const yearMatch = periodLower.match(/\b(202[0-9])\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));

    return {
      start: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      end: endDate.toISOString().split("T")[0], // YYYY-MM-DD
    };
  }

  // 6️⃣ Fallback: sem filtro de data
  console.warn(
    `⚠️ Período não reconhecido: "${period}". Retornando sem filtro.`,
  );
  return {};
}
