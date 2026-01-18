import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { UploadedFile, FileType, CustomsData } from './types';
import { readFileContent } from './services/fileParser';
import { analyzeDocuments } from './services/geminiService';
import { generateExcel } from './services/excelService';

const App: React.FC = () => {
  const [files, setFiles] = useState<Record<FileType, UploadedFile>>({
    [FileType.CONTRACT]: { id: '1', type: 'contract', file: null, content: null, status: 'empty' },
    [FileType.INVOICE]: { id: '2', type: 'invoice', file: null, content: null, status: 'empty' },
    [FileType.DESCRIPTION]: { id: '3', type: 'description', file: null, content: null, status: 'empty' },
    [FileType.PACKING]: { id: '4', type: 'packing', file: null, content: null, status: 'empty' },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomsData | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
     // Check if API key is effectively present (env variable is injected at build/runtime)
     // Since we are instructed to use process.env.API_KEY directly and it's assumed valid
     setHasApiKey(!!process.env.API_KEY);
  }, []);

  const handleFileSelect = async (type: FileType, file: File) => {
    // Optimistically update UI
    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], file, status: 'reading' }
    }));

    try {
      const textContent = await readFileContent(file);
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], content: textContent, status: 'ready' }
      }));
    } catch (err) {
      console.error(err);
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'error', file: null }
      }));
      setError(`Error reading ${type} file. Please ensure it is a valid .docx or .txt file.`);
    }
  };

  const handleProcess = async () => {
    // Validation
    const missingFiles = (Object.values(files) as UploadedFile[]).filter(f => f.status !== 'ready');
    if (missingFiles.length > 0) {
      setError("Please upload all 4 required documents before processing.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await analyzeDocuments(
        files[FileType.CONTRACT].content!,
        files[FileType.INVOICE].content!,
        files[FileType.DESCRIPTION].content!,
        files[FileType.PACKING].content!
      );
      setResult(data);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      generateExcel(result);
    }
  };

  const getIcon = (type: FileType) => {
    const className = "h-8 w-8";
    switch (type) {
      case FileType.CONTRACT:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
      case FileType.INVOICE:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case FileType.DESCRIPTION:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.327 24.327 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
      case FileType.PACKING:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-600 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">China Customs AI Declarant</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your trade documents (Contract, Invoice, Goods Description, Packing List) to automatically generate a compliant Chinese Customs Declaration Excel file.
          </p>
        </header>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <FileUploader 
            label="Contract" 
            description="Details on parties, subject matter, bank info" 
            fileData={files[FileType.CONTRACT]} 
            onFileSelect={(f) => handleFileSelect(FileType.CONTRACT, f)} 
            icon={getIcon(FileType.CONTRACT)}
          />
          <FileUploader 
            label="Invoice" 
            description="Amounts, currency, dates, incoterms" 
            fileData={files[FileType.INVOICE]} 
            onFileSelect={(f) => handleFileSelect(FileType.INVOICE, f)} 
            icon={getIcon(FileType.INVOICE)}
          />
          <FileUploader 
            label="Goods Description" 
            description="HS Code, composition, chemical formulas" 
            fileData={files[FileType.DESCRIPTION]} 
            onFileSelect={(f) => handleFileSelect(FileType.DESCRIPTION, f)} 
            icon={getIcon(FileType.DESCRIPTION)}
          />
          <FileUploader 
            label="Packing List" 
            description="Package counts, weights (net/gross)" 
            fileData={files[FileType.PACKING]} 
            onFileSelect={(f) => handleFileSelect(FileType.PACKING, f)} 
            icon={getIcon(FileType.PACKING)}
          />
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-12">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-lg text-sm max-w-2xl animate-pulse">
              {error}
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={isProcessing || (Object.values(files) as UploadedFile[]).some(f => f.status !== 'ready')}
            className={`
              relative px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0
              ${isProcessing 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : (Object.values(files) as UploadedFile[]).some(f => f.status !== 'ready')
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200'
              }
            `}
          >
            {isProcessing ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing with Gemini Pro...
              </span>
            ) : "Analyze & Generate Excel"}
          </button>
          
          <p className="text-xs text-slate-400">
            Powered by Gemini 3.0 Pro. Files are processed securely.
          </p>
        </div>

        {/* Results Area */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis Complete
              </h2>
              <button 
                onClick={handleDownload}
                className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm"
              >
                Download Excel (.xlsx)
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Summary</h3>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg text-sm leading-relaxed border border-slate-100">
                  {result.summary}
                </p>
              </div>

              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Extracted Goods Details (Preview)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">HS Code</th>
                      <th className="px-4 py-3">Name (CN)</th>
                      <th className="px-4 py-3">Elements (申报要素)</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.goodsList.map((item, idx) => (
                      <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-indigo-600">{item.hsCode}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.nameChinese}</td>
                        <td className="px-4 py-3 text-xs max-w-xs truncate" title={item.elementString}>
                          {item.elementString}
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-right">{result.invoiceInfo.currency} {item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                 <button 
                  onClick={handleDownload}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Declaration File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;