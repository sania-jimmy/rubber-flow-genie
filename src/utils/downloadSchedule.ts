import { ProductionSchedule } from "@/types/production";
import { format } from "date-fns";

export const downloadScheduleAsCSV = (
  schedule: ProductionSchedule,
  workingHoursPerDay: number
) => {
  // Production Order CSV
  let csv = "Production Schedule - Optimized Order\n\n";
  csv += "Order,Product Name,Quantity,Pieces per Day,Days Required,Start Day,Extra Days,Due Date\n";
  
  schedule.products.forEach((product) => {
    csv += `${product.productionOrder},${product.name},${product.count},${product.piecesPerDay},${product.totalDaysRequired},${product.startDay + 1},${product.extraDays},${format(product.requirementDate, "yyyy-MM-dd")}\n`;
  });

  csv += "\n\nDaily Schedule Breakdown\n\n";
  csv += "Day,Date,Product,Pieces,Hours Used,Total Hours,Utilization %\n";

  schedule.dailySchedule.forEach((day) => {
    day.products.forEach((product, idx) => {
      const utilization = ((day.totalHoursUsed / workingHoursPerDay) * 100).toFixed(1);
      csv += `${day.day},${format(day.date, "yyyy-MM-dd")},${product.productName},${product.pieces},${product.hoursUsed.toFixed(2)},${idx === 0 ? day.totalHoursUsed.toFixed(2) : ''},${idx === 0 ? utilization + '%' : ''}\n`;
    });
  });

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const downloadScheduleAsText = (
  schedule: ProductionSchedule,
  workingHoursPerDay: number
) => {
  let text = "=" .repeat(70) + "\n";
  text += "RUBBER FACTORY PRODUCTION SCHEDULE\n";
  text += "Generated: " + format(new Date(), "PPpp") + "\n";
  text += "=".repeat(70) + "\n\n";

  text += "SUMMARY\n";
  text += "-".repeat(70) + "\n";
  text += `Total Production Days: ${schedule.totalDays}\n`;
  text += `Total Products: ${schedule.products.length}\n`;
  text += `Working Hours per Day: ${workingHoursPerDay}h\n`;
  text += `Delayed Products: ${schedule.products.filter(p => p.extraDays > 0).length}\n\n`;

  text += "OPTIMIZED PRODUCTION ORDER\n";
  text += "=".repeat(70) + "\n\n";

  schedule.products.forEach((product) => {
    text += `#${product.productionOrder} - ${product.name}\n`;
    text += "-".repeat(70) + "\n";
    text += `Quantity: ${product.count} pieces\n`;
    text += `Processing Time: ${product.processingTimePerUnit}h per unit\n`;
    text += `Days Required: ${product.totalDaysRequired} days\n`;
    text += `Pieces per Day: ${product.piecesPerDay} units\n`;
    text += `Start Day: Day ${product.startDay + 1}\n`;
    text += `Due Date: ${format(product.requirementDate, "PPP")}\n`;
    if (product.extraDays > 0) {
      text += `⚠️  DELAYED BY: ${product.extraDays} days\n`;
    }
    text += "\n";
  });

  text += "\nDAILY PRODUCTION BREAKDOWN\n";
  text += "=".repeat(70) + "\n\n";

  schedule.dailySchedule.forEach((day) => {
    const utilization = ((day.totalHoursUsed / workingHoursPerDay) * 100).toFixed(1);
    text += `Day ${day.day} - ${format(day.date, "EEEE, MMMM dd, yyyy")}\n`;
    text += "-".repeat(70) + "\n";
    text += `Total Hours: ${day.totalHoursUsed.toFixed(2)}h / ${workingHoursPerDay}h (${utilization}%)\n`;
    text += "Products:\n";
    day.products.forEach((product) => {
      text += `  • ${product.productName}: ${product.pieces} pieces (${product.hoursUsed.toFixed(2)}h)\n`;
    });
    text += "\n";
  });

  // Create blob and download
  const blob = new Blob([text], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-schedule-${format(new Date(), "yyyy-MM-dd")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
