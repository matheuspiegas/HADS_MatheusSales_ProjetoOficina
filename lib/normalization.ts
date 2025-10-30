/**
 * Normaliza um texto para ser compatível com a função `normalize_text` do PostgreSQL.
 * Converte para minúsculas, remove acentos e espaços extras.
 * @param text O texto a ser normalizado.
 * @returns O texto normalizado.
 */
export const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase() // Converte para minúsculas
    .trim(); // Remove espaços no início e fim
};
