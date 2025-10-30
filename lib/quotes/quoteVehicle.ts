import type jsPDF from "jspdf";

import { FormType } from "@/schemas";

export class QuoteVehicle {
  private doc: jsPDF;
  private vehicle: FormType["veiculo"];

  constructor(doc: jsPDF, vehicle: FormType["veiculo"]) {
    this.doc = doc;
    this.vehicle = vehicle;
  }

  generate() {
    const startX = 100;
    let startY = 50;
    const lineHeight = 7.5;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Dados do veículo: ", startX, 50);
    this.doc.setFont("helvetica", "normal");

    const vehicleData = [
      { label: "Marca", value: this.vehicle.marca || "" },
      { label: "Modelo", value: this.vehicle.modelo || "" },
      { label: "Ano", value: this.vehicle.ano || "" },
      { label: "Placa", value: this.vehicle.placa || "" },
      { label: "Cor", value: this.vehicle.cor || "" },
      { label: "Chassi", value: this.vehicle.chassi || "" },
    ];
    vehicleData.forEach((item) => {
      const startY2 = 50 + lineHeight;
      if (item.label === "Cor") {
        this.doc.text(`${item.label}: ${item.value}`, startX + 50, startY2);
      } else if (item.label === "Chassi") {
        this.doc.text(
          `${item.label}: ${item.value}`,
          startX + 50,
          startY2 + lineHeight,
        );
      } else if (item.label === "Placa") {
        this.doc.text(`${item.label}: ${item.value}`, startX, 79);
      } else {
        this.doc.text(
          `${item.label}: ${item.value}`,
          startX,
          startY + lineHeight,
        );
      }
      startY += lineHeight;
    });
  }
}
