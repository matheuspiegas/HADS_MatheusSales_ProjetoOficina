import type jsPDF from "jspdf";

import {
  COMPANY_ADDRESS,
  COMPANY_CNPJ,
  COMPANY_NAME,
  COMPANY_PHONE,
} from "@/constants";
// import logo from "/logoFS.jpg";

export class QuoteHeader {
  private doc: jsPDF;
  private createdAt: string;

  constructor(doc: jsPDF, createdAt: string) {
    this.doc = doc;
    this.createdAt = createdAt;
  }

  generate() {
    this.doc.rect(10, 10, 190, 30);
    const img = new Image();
    img.src = "/logo-light.png";
    this.doc.addImage(img, "JPEG", 15, 15, 37, 20);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(COMPANY_NAME, 60, 17);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.text(COMPANY_ADDRESS, 60, 22);
    this.doc.text(COMPANY_CNPJ, 60, 27);
    this.doc.text(COMPANY_PHONE, 60, 32);
    this.doc.text(
      "Data: " + new Date(this.createdAt).toLocaleDateString(),
      60,
      37,
    );
  }
}
