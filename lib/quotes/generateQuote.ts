import { jsPDF } from "jspdf";

import { FormType } from "@/schemas";

import { QuoteBody } from "./quoteBody";
import { QuoteCustomer } from "./quoteCustomer";
import { QuoteVehicle } from "./quoteVehicle";

export const generateQuote = (quotes: FormType, createdAt: string) => {
  const doc = new jsPDF({
    format: "a4",
  });
  const cliente = quotes.cliente;
  const veiculo = quotes.veiculo;
  const servicos = quotes.servicos;
  const observacoes = quotes.observacoes;

  const customer = new QuoteCustomer(doc, cliente);
  const vehicle = new QuoteVehicle(doc, veiculo);
  const body = new QuoteBody(doc, servicos, createdAt, observacoes);
  customer.generate();
  vehicle.generate();
  body.generate();

  return doc.output("blob");
};
