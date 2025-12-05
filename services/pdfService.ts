
// Access the global pdfjsLib injected via script tag in index.html
// In a real build environment, you would import this from 'pdfjs-dist'
const getPdfLib = () => {
    const lib = (window as any).pdfjsLib;
    if (!lib) {
        console.warn("PDF.js lib not found on window, retrying...");
    }
    return lib;
}

export const extractTextFromPdf = async (
  file: File, 
  onProgress?: (current: number, total: number) => void
): Promise<string> => {
  const pdfjs = getPdfLib();
  if (!pdfjs) {
    throw new Error("PDF.js library failed to load. Please refresh the page.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // ROBUST CHECK: Ensure file is not empty
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("The file is empty or corrupted (0 bytes).");
    }

    // CRITICAL FIX: Use a copy of the buffer to ensure data integrity for the worker
    const typedArray = new Uint8Array(arrayBuffer.slice(0));

    const loadingTask = pdfjs.getDocument({ 
        data: typedArray,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
        disableFontFace: true, // KEY FIX: Disabling font parsing fixes "Invalid PDF structure" for many files
        rangeChunkSize: 65536, // chunk size for range requests
        isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    if (numPages === 0) {
        throw new Error("PDF seems to have no pages.");
    }

    const fullTextParts: string[] = [];

    // Process pages in groups
    const PAGE_BATCH_SIZE = 20; // Increased batch size for speed
    
    for (let i = 1; i <= numPages; i += PAGE_BATCH_SIZE) {
        const batchPromises = [];
        const endPage = Math.min(i + PAGE_BATCH_SIZE - 1, numPages);
        
        for (let pageNum = i; pageNum <= endPage; pageNum++) {
            batchPromises.push(
                pdf.getPage(pageNum).then(async (page: any) => {
                    try {
                        const textContent = await page.getTextContent({
                            disableCombineTextItems: false,
                            includeMarkedContent: false
                        });
                        const text = textContent.items.map((item: any) => item.str).join(' ');
                        return text;
                    } catch (pageErr) {
                         console.warn(`Warning: Could not parse page ${pageNum}, skipping.`, pageErr);
                         return ''; 
                    } finally {
                        page.cleanup();
                    }
                }).catch((err: any) => {
                    console.warn(`Error accessing page ${pageNum}:`, err);
                    return '';
                })
            );
        }
        
        const batchTexts = await Promise.all(batchPromises);
        fullTextParts.push(...batchTexts);
        
        if (onProgress) {
            onProgress(endPage, numPages);
        }
    }

    const fullText = fullTextParts.join(' ');
    
    // Check if we extracted any text at all
    if (!fullText.replace(/\s/g, '').length) {
        throw new Error("No text found. This PDF might be a scanned image.");
    }

    return fullText;

  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    if (error.name === 'InvalidPDFException') {
        throw new Error("Invalid PDF structure. The file might be corrupted, password protected, or relies on missing system fonts.");
    }
    throw error;
  }
};

export const chunkText = (text: string, chunkSize: number = 4500, overlap: number = 200): string[] => {
  // Clean up text first: remove excessive newlines/spaces
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (!cleanText) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    chunks.push(cleanText.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
};
