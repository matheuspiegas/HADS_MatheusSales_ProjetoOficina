import type jsPDF from "jspdf";

import { FormType } from "@/schemas";

export class QuoteCustomer {
  private doc: jsPDF;
  private customer: FormType["cliente"];

  constructor(doc: jsPDF, customer: FormType["cliente"]) {
    this.doc = doc;
    this.customer = customer;
  }

  generate() {
    const startLineX = 10;
    const endLineX = 200;
    let lineY = 60;
    const lineHeightLabel = 7;
    const startX = 11.5;
    let startY = 57.5;
    const lineHeight = 7.5;
    this.doc.setLineWidth(0.1);
    this.doc.rect(10, 45, 190, 36, "S");
    this.doc.setFillColor("#ccc");
    this.doc.rect(10, 45, 190, 8, "FD");

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Dados do cliente: ", 11.5, 50);
    this.doc.setFont("helvetica", "normal");

    const customerData = [
      { label: "Nome", value: this.customer.nome || "" },
      { label: "Telefone", value: this.customer.telefone || "" },
      { label: "CPF", value: this.customer.cpf || "" },
      { label: "Endereço", value: this.customer.endereco || "" },
    ];

    customerData.forEach((customer) => {
      if (customer.label === "Endereço") {
        this.doc.text(`${customer.label}: ${customer.value}`, startX, 79);
      } else {
        this.doc.text(`${customer.label}: ${customer.value}`, startX, startY);
        this.doc.line(startLineX, lineY, endLineX, lineY);
      }
      lineY += lineHeightLabel;
      startY += lineHeight;
    });
  }
}
