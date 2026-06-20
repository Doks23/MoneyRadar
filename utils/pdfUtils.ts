import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';
}

export async function checkAndDecryptPdf(file: File, password?: string): Promise<{ isEncrypted: boolean; decryptedFile?: File; error?: string }> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        try {
            // Setup loading task with optional password
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                password: password || undefined
            });
            
            const pdfDoc = await loadingTask.promise;
            
            if (password) {
                // If a password was provided and loaded successfully, extract the text contents in the safety of the browser container
                let text = '';
                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    text += pageText + '\n';
                }
                
                // Pack the extracted text as a plain text file so it seamlessly works with standard backend/offline parsers
                const textFile = new File([text], file.name, { type: 'text/plain' });
                return { isEncrypted: true, decryptedFile: textFile };
            }
            
            return { isEncrypted: false };
        } catch (error: any) {
            console.warn("PDF load/decryption check failed:", error);
            
            // Check if it's a password restriction error
            const isPasswordError = 
                error?.name === 'PasswordException' || 
                error?.message?.toLowerCase().includes('password') || 
                error?.message?.toLowerCase().includes('encrypted') ||
                error?.code === 1; // 1 represents password exception in some pdfjs contexts
                
            if (isPasswordError) {
                return { 
                    isEncrypted: true, 
                    error: password ? 'Incorrect password' : 'Password required' 
                };
            }
            
            throw error;
        }
    } catch (error: any) {
        console.error("Error processing PDF:", error);
        throw new Error(`Failed to process PDF: ${error.message || error}`);
    }
}
