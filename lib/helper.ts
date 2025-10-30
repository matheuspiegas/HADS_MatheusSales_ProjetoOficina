export const convertToMoney = (value: string | number) => {
  if (typeof value === "string") {
    value = parseFloat(value.replace(/\./g, "").replace(",", "."));
  }
  if (isNaN(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const convertMoneyToNumber = (value: string) => {
  const number = parseFloat(
    value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
  return isNaN(number) ? 0 : number;
};

export const generateFormattedFileName = (name: string, created_at: string) => {
  const cleanedName = name
    .normalize("NFD") // Decompõe os caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos, cedilhas, etc.)
    .replace(/[^a-zA-Z0-9-]/g, "") // Mantém apenas letras, números e hífens
    .toLowerCase();

  const now = new Date(created_at);

  const dia = String(now.getDate()).padStart(2, "0");
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const ano = now.getFullYear();
  const hora = String(now.getHours()).padStart(2, "0");
  const minuto = String(now.getMinutes()).padStart(2, "0");
  // const segundo = String(now.getSeconds()).padStart(2, "0");

  return `${cleanedName} ${dia}/${mes}/${ano} ${hora}:${minuto}`.toLowerCase();
};

export function parseMoney(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }

  // Se a string tem ',' mas não '.', é provável que seja separador decimal brasileiro
  if (value.includes(",") && !value.includes(".")) {
    return parseFloat(value.replace(",", "."));
  }

  // Se tem os dois, normalmente '.' é separador de milhar e ',' é separador decimal
  if (value.includes(".") && value.includes(",")) {
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
  }

  // Caso contrário, confia no parseFloat
  return parseFloat(value);
}
