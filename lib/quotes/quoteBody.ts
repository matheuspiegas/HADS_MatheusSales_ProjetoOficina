import { unformat } from "@react-input/number-format";
import type jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

import { FormType } from "@/schemas";

import { QuoteHeader } from "./quoteHeader";
import { QuoteOS } from "./quoteOS";

export class QuoteBody {
  private doc: jsPDF;
  private quotes: FormType["servicos"];
  private observacoes?: string;
  private createdAt: string;

  constructor(
    doc: jsPDF,
    quotes: FormType["servicos"],
    createdAt: string,
    observacoes?: string,
  ) {
    this.doc = doc;
    this.quotes = quotes;
    this.observacoes = observacoes;
    this.createdAt = createdAt;
  }

  generate() {
    const servicesWithPriceFormatted = this.quotes.map((service) => {
      return {
        ...service,
        preco: Number(unformat(service.preco)),
      };
    });
    autoTable(this.doc, {
      head: [["Serviço", "Valor"]],
      theme: "grid",
      headStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: "#ccc",
        textColor: [0, 0, 0],
        fontSize: 10,
        cellWidth: "wrap",
        font: "helvetica",
      },
      styles: {
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
      },
      startY: 90,
      margin: { top: 50, horizontal: 10 },
      body: servicesWithPriceFormatted.map((service) => [
        service.nome,
        Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(service.preco),
      ]),
      didDrawPage: () => {
        const header = new QuoteHeader(this.doc, this.createdAt);
        header.generate();
      },
    });

    const finalY = (this.doc as any).lastAutoTable.finalY;

    const totalPrice = servicesWithPriceFormatted
      .reduce((acc, service) => acc + service.preco, 0)
      .toLocaleString("pt-BR", { currency: "BRL", style: "currency" });

    this.observacoes && this.observacoes.length > 1
      ? autoTable(this.doc, {
          head: [["Observações"]],
          theme: "grid",
          headStyles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            fillColor: "#ccc",
            textColor: [0, 0, 0],
            fontSize: 10,
            cellWidth: "wrap",
            font: "helvetica",
          },
          styles: {
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
          },
          startY: finalY + 10,
          margin: { top: 50, horizontal: 10 },
          body: [[this.observacoes.trim()]],
          didDrawPage: () => {
            const header = new QuoteHeader(this.doc, this.createdAt);
            header.generate();
          },
        })
      : null;

    const finalY2 = (this.doc as any).lastAutoTable.finalY;

    autoTable(this.doc, {
      head: [["Subtotal", "Desconto", "Acréscimo", "Total"]],
      theme: "grid",
      headStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: "#ccc",
        textColor: [0, 0, 0],
        fontSize: 10,
        cellWidth: "wrap",
        font: "helvetica",
      },
      styles: {
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
      },
      startY: finalY2 + 10,
      margin: { top: 50, horizontal: 10 },
      body: [[totalPrice, "R$ 0,00", "R$ 0,00", totalPrice]],
      didDrawPage: () => {
        const header = new QuoteHeader(this.doc, this.createdAt);
        header.generate();
      },
    });

    new QuoteOS(this.doc, this.createdAt).generate();
  }
}
