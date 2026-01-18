import { GoogleGenAI, Type } from "@google/genai";
import { CustomsData } from "../types";

export const analyzeDocuments = async (
  contractText: string,
  invoiceText: string,
  descText: string,
  packingText: string
): Promise<CustomsData> => {

  // 1. Берем ключ правильным способом (для Vite)
  const apiKey = import.meta.env.VITE_API_KEY;

  // 2. Если ключа нет — только тогда ругаемся
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables. Check Netlify settings.");
  }

  const apiKey = import.meta.env.VITE_API_KEY;

  // Prompt Engineering
  const systemInstruction = `
    You are an expert China Customs Broker and International Trade Specialist.
    Your task is to analyze four input documents (Contract, Invoice, Product Description, Packing List) and extract specific data to prepare a Chinese Customs Declaration Excel file.
    
    CRITICAL RULES:
    1. Output MUST be valid JSON.
    2. Translate all descriptions and names into simplified CHINESE suitable for customs declaration.
    3. Accurately determine the HS Code based on the description provided. If the provided HS Code is rough, refine it to the China Customs 10-digit format if possible, or keep the provided 6-8 digit one if unsure.
    4. For "elementString" (申报要素), you must construct the string required by Chinese customs based on the HS code logic (e.g., "品牌|型号|成分|用途"). Use the "Description" document to fill this.
    5. Ensure strict consistency between the 4 documents. If there is a conflict, prioritize the Invoice for numbers and the Description for product details.
  `;

  const userPrompt = `
    Please analyze the following 4 documents content:

    --- DOCUMENT 1: CONTRACT ---
    ${contractText.slice(0, 10000)}

    --- DOCUMENT 2: INVOICE ---
    ${invoiceText.slice(0, 10000)}

    --- DOCUMENT 3: PRODUCT DESCRIPTION & HS CODE ---
    ${descText.slice(0, 10000)}

    --- DOCUMENT 4: PACKING LIST ---
    ${packingText.slice(0, 10000)}

    Generate a JSON response that fills the following structure. 
    Ensure all string values in 'goodsList' are in Chinese (except model numbers or brands that are naturally English).
    Calculate total weights if not explicitly stated by summing items.
  `;

  // Define Schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      contractInfo: {
        type: Type.OBJECT,
        properties: {
          contractNumber: { type: Type.STRING },
          date: { type: Type.STRING },
          buyer: { type: Type.STRING },
          seller: { type: Type.STRING },
          signingPlace: { type: Type.STRING }
        }
      },
      invoiceInfo: {
        type: Type.OBJECT,
        properties: {
          invoiceNumber: { type: Type.STRING },
          date: { type: Type.STRING },
          currency: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          incoterms: { type: Type.STRING }
        }
      },
      packingInfo: {
        type: Type.OBJECT,
        properties: {
          totalPackages: { type: Type.NUMBER },
          totalNetWeight: { type: Type.NUMBER },
          totalGrossWeight: { type: Type.NUMBER },
          packageType: { type: Type.STRING }
        }
      },
      goodsList: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hsCode: { type: Type.STRING },
            nameChinese: { type: Type.STRING },
            nameEnglish: { type: Type.STRING },
            elementString: { type: Type.STRING, description: "Declarable elements string (申报要素) in Chinese, e.g. 1:品名;2:成分..." },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING, description: "Unit in Chinese, e.g. 千克, 个" },
            unitPrice: { type: Type.NUMBER },
            totalPrice: { type: Type.NUMBER },
            netWeight: { type: Type.NUMBER },
            grossWeight: { type: Type.NUMBER },
            originCountry: { type: Type.STRING, description: "Country of origin in Chinese" }
          }
        }
      },
      summary: { type: Type.STRING, description: "A brief summary of what was analyzed and any potential issues found." }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex reasoning on chemical compositions/HS codes
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32768 } // High budget for deep analysis of chemical compositions
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as CustomsData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze documents. Please check your API key and file contents.");
  }
};
