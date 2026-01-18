// Utility to extract text from a DOCX file using Mammoth.js
export const extractTextFromDocx = async (file: File): Promise<string> => {
  if (!window.mammoth) {
    throw new Error('Mammoth.js library not loaded');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from docx:", error);
    throw new Error("Failed to parse DOCX file.");
  }
};

export const readFileContent = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    return await extractTextFromDocx(file);
  } else if (extension === 'txt') {
    return await file.text();
  } else {
    // Fallback for other text-based formats or let user know
    // For this demo, we assume the user follows instructions for DOCX
    // But we will try to read as text for robustness
    try {
      return await file.text();
    } catch (e) {
      throw new Error(`Unsupported file type: .${extension}`);
    }
  }
};