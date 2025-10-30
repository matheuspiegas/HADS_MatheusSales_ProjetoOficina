import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ReportSummary } from "@/actions/generate-report";
import { ReportsFiltersForm } from "@/schemas";

import { ReportHeader } from "./report-header";

interface GenerateReportProps {
  data: ReportSummary;
  filters: ReportsFiltersForm;
}

export function generateReport({ data, filters }: GenerateReportProps): Blob {
  const doc = new jsPDF();
  console.log("Generating report with data:", data.transactions);

  // Criar e adicionar o header
  const header = new ReportHeader(doc, {
    dateFrom: filters.date?.from,
    dateTo: filters.date?.to,
    type: filters.type,
    categories: filters.categories?.map((cat) => cat.label),
  });

  header.generate();

  // Obter a altura do header para posicionar o conteúdo
  const contentStartY = header.getHeaderHeight() + 10;

  // Função para formatar moeda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  };

  // Função para formatar tipo de transação
  const formatType = (type: "income" | "expense"): string => {
    return type === "income" ? "Entrada" : "Saída";
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy");
  };

  // Adicionar tabela de transações
  autoTable(doc, {
    head: [["Data", "Nome", "Tipo", "Categoria", "Valor"]],
    body: data.transactions.map((transaction) => [
      formatDate(transaction.transaction_date),
      transaction.name || "-",
      formatType(transaction.type),
      transaction.category?.name || "Sem categoria",
      formatCurrency(transaction.amount),
    ]),
    startY: contentStartY,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: "#00008B", // Azul escuro
      textColor: 255,
      fontStyle: "bold",
    },
    theme: "grid",
    tableWidth: 190, // Mesma largura do header
    columnStyles: {
      0: { cellWidth: 28 }, // Data
      1: { cellWidth: 75 }, // Nome (maior para aproveitar o espaço)
      2: { cellWidth: 25 }, // Tipo
      3: { cellWidth: 35 }, // Categoria
      4: { cellWidth: 27 }, // Valor
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Cinza claro
    },
    margin: { left: 10, right: 10 }, // Mesma margem do header
  });

  // Adicionar resumo financeiro
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Financeiro", 10, finalY);

  // Tabela de resumo
  autoTable(doc, {
    head: [["Transações", "Entradas", "Saídas", "Saldo Líquido"]],
    body: [
      [
        data.totalTransactions.toString(),
        formatCurrency(data.totalIncome),
        formatCurrency(data.totalExpense),
        formatCurrency(data.netAmount),
      ],
    ],
    headStyles: {
      fillColor: "#00008B",
    },
    columnStyles: {
      1: {
        textColor: "green",
      }, // Entradas
      2: {
        textColor: "red",
      }, // Saídas
      3: {
        textColor: data.netAmount >= 0 ? "green" : "red",
      }, // Saldo Líquido
    },
    startY: finalY + 10,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    tableWidth: 190, // Mesma largura do header
    theme: "grid",
    margin: { left: 10, right: 10 }, // Mesma margem do header
  });

  return doc.output("blob");
}
