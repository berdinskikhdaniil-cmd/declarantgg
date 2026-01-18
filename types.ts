export interface UploadedFile {
  id: string;
  type: 'contract' | 'invoice' | 'description' | 'packing';
  file: File | null;
  content: string | null; // Extracted text content
  status: 'empty' | 'reading' | 'ready' | 'error';
}

export enum FileType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  DESCRIPTION = 'description',
  PACKING = 'packing'
}

// Data structure expected from Gemini analysis
export interface CustomsData {
  contractInfo: {
    contractNumber: string;
    date: string;
    buyer: string;
    seller: string;
    signingPlace: string;
  };
  invoiceInfo: {
    invoiceNumber: string;
    date: string;
    currency: string;
    totalAmount: number;
    incoterms: string;
  };
  packingInfo: {
    totalPackages: number;
    totalNetWeight: number;
    totalGrossWeight: number;
    packageType: string; // e.g., Pallets, Cartons
  };
  goodsList: GoodsItem[];
  summary: string; // Brief AI summary of the analysis
}

export interface GoodsItem {
  hsCode: string;
  nameChinese: string;
  nameEnglish: string;
  elementString: string; // The complex chemical/composition string required by customs
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  netWeight: number;
  grossWeight: number;
  originCountry: string;
}

// Declare globals for CDN libraries
declare global {
  interface Window {
    mammoth: any;
    XLSX: any;
  }
}