import jsPDF from "jspdf";

import { COMPANY_NAME } from "@/constants";

import { QuoteHeader } from "./quoteHeader";

export class QuoteOS {
  private doc: jsPDF;
  private createdAt: string;

  constructor(doc: jsPDF, createdAt: string) {
    this.doc = doc;
    this.createdAt = createdAt;
  }

  generate() {
    const finalY = (this.doc as any).lastAutoTable.finalY;
    const pageHeight = this.doc.internal.pageSize.height;
    const marginBottom = 20;
    const blocoAltura = 50; // aproximadamente 5 linhas de ~10mm

    let startY = finalY + 10;

    if (startY + blocoAltura > pageHeight - marginBottom) {
      this.doc.addPage();
      startY = 50; // ou o valor padrão de onde começa na nova página
      const header = new QuoteHeader(this.doc, this.createdAt);
      header.generate();
    }

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      "Autorização para execução da Ordem de Serviço",
      10,
      startY + 10,
    );
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.text(
      "Autorizo a execução dos serviços descritos acima conforme orçamento apresentado.",
      10,
      startY + 20,
    );
    this.doc.text(
      "Assinatura do cliente: ______________________________________",
      10,
      startY + 30,
    );
    this.doc.text(
      `${COMPANY_NAME}: ______________________________________`,
      10,
      startY + 40,
    );
    this.doc.text(
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      10,
      startY + 50,
    );
  }
}
