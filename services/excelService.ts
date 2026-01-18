import { CustomsData, GoodsItem } from "../types";

export const generateExcel = (data: CustomsData) => {
  if (!window.XLSX) {
    console.error("SheetJS not loaded");
    return;
  }

  const wb = window.XLSX.utils.book_new();

  // --- SHEET 1: Customs Declaration Form (Simplified) ---
  // Mapping data to a format commonly used for import declaration
  const declHeader = [
    ["进口货物报关单草单 (Import Declaration Draft)"],
    [],
    ["预录入编号", "", "海关编号", ""],
    ["境内收货人", data.contractInfo.buyer, "境外发货人", data.contractInfo.seller],
    ["进口口岸", "", "进口日期", ""],
    ["申报日期", new Date().toISOString().split('T')[0], "运输方式", "水路/航空"],
    ["提运单号", "", "监管方式", "一般贸易"],
    ["合同协议号", data.contractInfo.contractNumber, "贸易国(地区)", data.goodsList[0]?.originCountry || ""],
    ["包装种类", data.packingInfo.packageType, "件数", data.packingInfo.totalPackages],
    ["毛重(KG)", data.packingInfo.totalGrossWeight, "净重(KG)", data.packingInfo.totalNetWeight],
    ["成交方式", data.invoiceInfo.incoterms, "运费", "", "保费", ""],
    [],
    ["项号", "商品编号", "商品名称及规格型号", "数量及单位", "单价/总价/币制", "原产国"],
  ];

  const declRows = data.goodsList.map((item, index) => [
    index + 1,
    item.hsCode,
    `${item.nameChinese}\n${item.elementString}`, // Stacking name and elements
    `${item.quantity} ${item.unit}`,
    `${item.unitPrice} / ${item.totalPrice} / ${data.invoiceInfo.currency}`,
    item.originCountry
  ]);

  const wsDecl = window.XLSX.utils.aoa_to_sheet([...declHeader, ...declRows]);
  
  // Styling adjustments (column widths)
  wsDecl['!cols'] = [
    { wch: 10 }, { wch: 15 }, { wch: 50 }, { wch: 20 }, { wch: 25 }, { wch: 15 }
  ];

  window.XLSX.utils.book_append_sheet(wb, wsDecl, "报关单草单 (Declaration)");


  // --- SHEET 2: Packing List (Chinese) ---
  const packingHeader = [
    ["装箱单 (PACKING LIST)"],
    ["Invoice No:", data.invoiceInfo.invoiceNumber, "Date:", data.invoiceInfo.date],
    [],
    ["No.", "Description", "Quantity", "Unit", "N.W.(KG)", "G.W.(KG)"]
  ];
  
  const packingRows = data.goodsList.map((item, index) => [
    index + 1,
    item.nameChinese,
    item.quantity,
    item.unit,
    item.netWeight,
    item.grossWeight
  ]);

  // Add totals row
  packingRows.push([
    "TOTAL",
    "",
    "",
    "",
    data.packingInfo.totalNetWeight,
    data.packingInfo.totalGrossWeight
  ]);

  const wsPacking = window.XLSX.utils.aoa_to_sheet([...packingHeader, ...packingRows]);
  wsPacking['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
  window.XLSX.utils.book_append_sheet(wb, wsPacking, "装箱单 (Packing List)");


  // --- SHEET 3: Invoice (Chinese/English) ---
  const invoiceHeader = [
    ["商业发票 (COMMERCIAL INVOICE)"],
    ["Seller:", data.contractInfo.seller],
    ["Buyer:", data.contractInfo.buyer],
    ["Invoice No:", data.invoiceInfo.invoiceNumber],
    ["Date:", data.invoiceInfo.date],
    [],
    ["Marks & Nos", "Description of Goods", "Quantity", "Unit Price", "Amount"]
  ];

  const invoiceRows = data.goodsList.map((item) => [
    "N/M", // Default No Marks usually
    item.nameEnglish || item.nameChinese,
    item.quantity,
    `${data.invoiceInfo.currency} ${item.unitPrice}`,
    `${data.invoiceInfo.currency} ${item.totalPrice}`
  ]);

  invoiceRows.push([
    "", "TOTAL", "", "", `${data.invoiceInfo.currency} ${data.invoiceInfo.totalAmount}`
  ]);

  const wsInvoice = window.XLSX.utils.aoa_to_sheet([...invoiceHeader, ...invoiceRows]);
  wsInvoice['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
  window.XLSX.utils.book_append_sheet(wb, wsInvoice, "发票 (Invoice)");


  // --- SHEET 4: Contract Info ---
  const contractData = [
    ["售货合同 (SALES CONTRACT)"],
    ["合同号 (Contract No):", data.contractInfo.contractNumber],
    ["签约日期 (Date):", data.contractInfo.date],
    ["签约地点 (Place):", data.contractInfo.signingPlace],
    ["买方 (Buyer):", data.contractInfo.buyer],
    ["卖方 (Seller):", data.contractInfo.seller],
    ["付款方式:", "T/T or L/C"],
  ];
  const wsContract = window.XLSX.utils.aoa_to_sheet(contractData);
  wsContract['!cols'] = [{ wch: 20 }, { wch: 50 }];
  window.XLSX.utils.book_append_sheet(wb, wsContract, "合同要素 (Contract)");

  // Write file
  window.XLSX.writeFile(wb, `Customs_Declaration_${data.invoiceInfo.invoiceNumber || 'Draft'}.xlsx`);
};