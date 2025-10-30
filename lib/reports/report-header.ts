import { format } from "date-fns";
import type jsPDF from "jspdf";

import {
  COMPANY_ADDRESS,
  COMPANY_CNPJ,
  COMPANY_NAME,
  COMPANY_PHONE,
} from "@/constants";

interface ReportHeaderOptions {
  dateFrom?: string;
  dateTo?: string;
  type?: "income" | "expense" | "all";
  categories?: string[];
}

export class ReportHeader {
  private doc: jsPDF;
  private options: ReportHeaderOptions;

  constructor(doc: jsPDF, options: ReportHeaderOptions = {}) {
    this.doc = doc;
    this.options = options;
  }

  generate() {
    // Desenhar retângulo do cabeçalho
    this.doc.rect(10, 10, 190, 40);

    // Adicionar logo da empresa
    const img = new Image();
    img.src = "/logo-light.png";
    this.doc.addImage(img, "JPEG", 15, 15, 40, 20);

    // Informações da empresa
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    // this.doc.text(COMPANY_NAME, 60, 17);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    // this.doc.text(COMPANY_ADDRESS, 60, 22);
    // this.doc.text(COMPANY_CNPJ, 60, 27);
    // this.doc.text(COMPANY_PHONE, 60, 32);

    // Título do relatório com período
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    const reportTitle = this.generateReportTitle();
    this.doc.text(reportTitle, 60, 17);

    // Data de geração do relatório
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    const generatedDate = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;
    this.doc.text(generatedDate, 60, 23);

    this.doc.text(
      "Categorias aplicadas: " +
        (this.options.categories && this.options.categories.length > 0
          ? this.options.categories.join(", ")
          : "Nenhum"),
      60,
      29,
    );
  }

  private generateReportTitle(): string {
    let title = "Relatório Financeiro";

    // Adicionar período se especificado
    if (this.options.dateFrom || this.options.dateTo) {
      const fromDate = this.options.dateFrom
        ? this.formatDateString(this.options.dateFrom)
        : "Início";

      const toDate = this.options.dateTo
        ? this.formatDateString(this.options.dateTo)
        : "Hoje";

      title += ` de ${fromDate} a ${toDate}`;
    }

    // Adicionar tipo se especificado e não for "all"
    if (this.options.type && this.options.type !== "all") {
      const typeText = this.options.type === "income" ? "Entradas" : "Saídas";
      title += ` - ${typeText}`;
    }

    return title;
  }

  // Método para formatar data usando date-fns
  private formatDateString(dateString: string): string {
    return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy");
  }

  // Método para obter a altura ocupada pelo header (útil para posicionar o conteúdo)
  getHeaderHeight(): number {
    return 55; // altura do retângulo + título + data de geração + margem
  }
}
