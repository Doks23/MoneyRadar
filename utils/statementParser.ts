import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit' | 'unknown';
  rawLine: string;
  confidence: number;
  category?: string;
  categoryConfidence?: number;
}

export async function extractRawText(file: File): Promise<{
  text: string;
  format: 'pdf_text' | 'pdf_image' | 'image' | 'text';
  confidence: number;
}> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    try {
      const text = await extractTextFromPDF(file);
      const meaningfulText = text
        .split('\n')
        .filter(line => line.trim().length > 5).length;

      if (meaningfulText > 10) {
        return { text, format: 'pdf_text', confidence: 0.95 };
      } else {
        const ocrText = await extractTextFromScannedPDF(file);
        const ocrMeaningfulLines = ocrText
          .split('\n')
          .filter(line => line.trim().length > 5).length;
        if (ocrMeaningfulLines > 10) {
          return { text: ocrText, format: 'pdf_image', confidence: 0.8 };
        }
        return { text: ocrText || text, format: 'pdf_image', confidence: 0.5 };
      }
    } catch (err) {
      console.error('PDF extraction failed', err);
      throw new Error('Failed to extract text from PDF');
    }
  } else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png)$/)) {
    const text = await extractTextFromImage(file);
    return { text, format: 'image', confidence: 0.8 };
  } else if (fileType === 'text/plain' || fileType === 'text/csv' || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
    const text = await file.text();
    return { text, format: 'text', confidence: 1.0 };
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

async function extractTextFromImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const result = await Tesseract.recognize(url, 'eng');
  URL.revokeObjectURL(url);
  return result.data.text;
}

async function extractTextFromScannedPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const scale = 2;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) continue;

    const result = await Tesseract.recognize(blob, 'eng');
    fullText += result.data.text + '\n';
  }

  return fullText;
}

export function findStatementStart(text: string): number {
  const statementMarkers = [
    /statement\s+of\s+account/i,
    /bank\s+statement/i,
    /account\s+statement/i,
    /transaction\s+details?/i,
    /credit\s+card\s+statement/i,
  ];

  const transactionHeaders = [
    /date\s+.*\s+description\s+.*\s+amount/i,
    /posting\s+date.*amount/i,
    /transaction\s+date.*debit.*credit/i,
    /date\s+.*particulars\s+.*amount/i,
    /txn\s+date.*narration/i,
  ];

  const lines = text.split('\n');

  let startLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const isMarker = statementMarkers.some(re => re.test(lines[i]));
    if (isMarker) {
      startLine = i;
      break;
    }
  }

  for (let i = startLine; i < Math.min(startLine + 50, lines.length); i++) {
    const isHeader = transactionHeaders.some(re => re.test(lines[i]));
    if (isHeader) {
      return i + 1;
    }
  }

  // Look for the first line that looks like a transaction
  for (let i = 0; i < Math.min(100, lines.length); i++) {
     if (/^[\d\-\/]{6,10}\s+.+\s+[\d,]+\.?\d{0,2}/.test(lines[i])) {
         return i;
     }
  }

  return Math.min(20, lines.length - 1);
}

export function extractBankName(text: string): string {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('hdfc bank')) return 'HDFC Bank';
  if (textLower.includes('icici bank')) return 'ICICI Bank';
  if (textLower.includes('state bank of india') || textLower.includes('sbi')) return 'State Bank of India';
  if (textLower.includes('axis bank')) return 'Axis Bank';
  if (textLower.includes('kotak mahindra')) return 'Kotak Mahindra Bank';
  if (textLower.includes('yes bank')) return 'Yes Bank';
  if (textLower.includes('indusind bank')) return 'IndusInd Bank';
  if (textLower.includes('bank of baroda')) return 'Bank of Baroda';
  if (textLower.includes('punjab national bank')) return 'Punjab National Bank';
  if (textLower.includes('citibank') || textLower.includes('citi bank')) return 'Citibank';
  if (textLower.includes('standard chartered')) return 'Standard Chartered';
  if (textLower.includes('hsbc')) return 'HSBC';
  if (textLower.includes('american express') || textLower.includes('amex')) return 'American Express';
  if (textLower.includes('chase')) return 'Chase Bank';
  if (textLower.includes('bank of america')) return 'Bank of America';
  if (textLower.includes('wells fargo')) return 'Wells Fargo';

  return 'Unknown Bank';
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export function parseTransactions(text: string): ParsedTransaction[] {
  const cleanedText = cleanText(text);
  const startIdx = findStatementStart(cleanedText);
  const lines = cleanedText.split('\n').slice(startIdx);

  const transactions: ParsedTransaction[] = [];
  let currentTransaction: ParsedTransaction | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseLine(line);
    
    if (parsed && parsed.amount !== null && parsed.date !== null) {
      if (currentTransaction) {
        transactions.push(currentTransaction);
      }
      currentTransaction = parsed;
    } else if (currentTransaction && line.trim().length > 0) {
      // If it's not a new transaction, it might be a continuation of the description
      // Ignore lines that look like page headers/footers or balances
      const lowerLine = line.toLowerCase();
      if (!lowerLine.includes('page') && !lowerLine.includes('balance') && !lowerLine.includes('total') && line.length < 60) {
         currentTransaction.description += ' ' + line.trim();
      }
    }
  }
  
  if (currentTransaction) {
    transactions.push(currentTransaction);
  }

  return transactions;
}

function parseLine(line: string): ParsedTransaction | null {
  if (
    line.toLowerCase().includes('total') ||
    line.toLowerCase().includes('opening balance') ||
    line.toLowerCase().includes('closing balance') ||
    line.toLowerCase().includes('brought forward') ||
    line.toLowerCase().includes('carried forward')
  ) {
    return null;
  }

  const datePatterns = [
    {
      regex: /\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/,
      parse: (m: RegExpMatchArray) => {
        const day = parseInt(m[1]);
        const month = parseInt(m[2]);
        let year = parseInt(m[3]);
        if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
        }
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        return new Date(year, month - 1, day);
      },
    },
    {
      regex: /\b(\d{1,2})[-\/.\s](\w{3})[-\/.\s](\d{2,4})\b/,
      parse: (m: RegExpMatchArray) => {
        const day = parseInt(m[1]);
        const monthStr = m[2].toLowerCase();
        let year = parseInt(m[3]);
        if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
        }
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames.indexOf(monthStr);
        if (month === -1) return null;
        if (day < 1 || day > 31) return null;
        return new Date(year, month, day);
      },
    },
    {
      regex: /\b(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/,
      parse: (m: RegExpMatchArray) => {
        const year = parseInt(m[1]);
        const month = parseInt(m[2]);
        const day = parseInt(m[3]);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        return new Date(year, month - 1, day);
      },
    }
  ];

  let date: Date | null = null;
  let dateMatchStr = '';
  for (const pattern of datePatterns) {
    const match = line.match(pattern.regex);
    if (match) {
      const parsedDate = pattern.parse(match);
      if (parsedDate) {
        date = parsedDate;
        dateMatchStr = match[0];
        break;
      }
    }
  }

  const amountPattern = /(?:₹|Rs\.?|Rs|INR|₹\s*)?\s*([\d,]+\.\d{2})\s*(Cr|Dr|Cr\.|Dr\.)?/i;
  const amountMatch = line.match(amountPattern);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  const amountSuffix = amountMatch && amountMatch[2] ? amountMatch[2].toLowerCase() : '';

  if (!date || !amount) return null;

  let description = '';
  if (dateMatchStr && amountMatch) {
      const descStart = line.indexOf(dateMatchStr) + dateMatchStr.length;
      const descEnd = line.lastIndexOf(amountMatch[0]);
      if (descEnd > descStart) {
          description = line.substring(descStart, descEnd).trim();
      } else {
          description = line.replace(dateMatchStr, '').replace(amountMatch[0], '').trim();
      }
  }

  description = description.replace(/\s+/g, ' ').replace(/[|:\-]{1,3}/g, '').trim().substring(0, 150);

  const creditKeywords = ['credit', 'deposit', 'transfer in', 'salary', 'refund', 'cr', 'neft in', 'upi/cr', 'imps/cr'];
  const debitKeywords = ['debit', 'withdrawal', 'payment', 'charge', 'fee', 'dr', 'neft out', 'upi/dr', 'imps/dr'];
  
  const lineTokens = line.toLowerCase().split(/\s+/);
  const isCredit = amountSuffix.includes('cr') || creditKeywords.some(kw => lineTokens.includes(kw) || line.toLowerCase().endsWith(' cr'));
  const isDebit = amountSuffix.includes('dr') || debitKeywords.some(kw => lineTokens.includes(kw) || line.toLowerCase().endsWith(' dr'));

  const type: 'debit' | 'credit' | 'unknown' = isCredit ? 'credit' : isDebit ? 'debit' : 'unknown';

  const confidence = (date ? 0.3 : 0) + (amount ? 0.3 : 0) + (description.length > 5 ? 0.2 : 0) + (type !== 'unknown' ? 0.2 : 0);

  // Format date to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return {
    date: dateStr,
    description,
    amount,
    type,
    rawLine: line,
    confidence,
  };
}

export function extractMerchant(description: string): string {
  return description
    .split(/[#@]/)[0]
    .replace(/[0-9]{5,}/g, '') // Remove long numbers (like transaction IDs)
    .replace(/upi\/[a-zA-Z0-9.\-_]+@[a-zA-Z]+/i, '') // Remove UPI IDs
    .replace(/neft-[a-zA-Z0-9]+/i, '') // Remove NEFT IDs
    .replace(/imps-[a-zA-Z0-9]+/i, '') // Remove IMPS IDs
    .replace(/rtgs-[a-zA-Z0-9]+/i, '') // Remove RTGS IDs
    .replace(/pos\s+\d+/i, '') // Remove POS terminal IDs
    .replace(/atm\s+w\/d/i, 'ATM Withdrawal')
    .trim()
    .toLowerCase();
}

export function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export class FuzzyCategor {
  private merchantMap: Map<string, Map<string, number>> = new Map();
  private rules: Array<{ pattern: RegExp; category: string; weight: number }> = [];

  constructor(initialRules?: Array<{ pattern: RegExp; category: string }>) {
    this.setupDefaultRules();
    if (initialRules) {
      initialRules.forEach(rule => {
        this.addRule(rule.pattern, rule.category, 0.9);
      });
    }
  }

  private setupDefaultRules() {
    const ruleDefinitions = [
      { pattern: /supermarket|grocery|bisleri|amazon fresh|big basket|walmart|costco|whole foods|dmart|reliance fresh|blinkit|zepto|instamart/i, category: 'Groceries', weight: 0.95 },
      { pattern: /restaurant|cafe|pizza|burger|cafe coffee|starbucks|mcd|doordash|swiggy|zomato|ubereats|food delivery|kfc|dominos|subway/i, category: 'Dining', weight: 0.95 },
      { pattern: /uber|ola|metro|fuel|petrol|parking|taxi|lyft|bus|flight|airline|railway|irctc|makemytrip|goibibo|redbus|indian oil|bharat petroleum|hpcl/i, category: 'Transport', weight: 0.95 },
      { pattern: /electricity|water|gas|broadband|wifi|internet|mobile|phone bill|jio|airtel|vodafone|bsnl|bescom|mahavitaran|adani|tatapower/i, category: 'Utilities', weight: 0.95 },
      { pattern: /netflix|prime video|spotify|movie|cinema|theatre|gaming|playstation|xbox|disney|hotstar|bookmyshow|pvrcinemas/i, category: 'Entertainment', weight: 0.95 },
      { pattern: /amazon|flipkart|ebay|myntra|ajio|clothing|apparel|shoes|dress|store|mall|retail|shopping|meesho|nykaa|croma|reliance digital/i, category: 'Shopping', weight: 0.95 },
      { pattern: /hospital|pharmacy|doctor|medical|clinic|health|medicine|apollo|fortis|dentist|practo|pharmeasy|1mg|netmeds/i, category: 'Healthcare', weight: 0.95 },
      { pattern: /gym|yoga|fitness|sports|gym fee|club membership|trainer|curefit|cultfit/i, category: 'Fitness', weight: 0.9 },
      { pattern: /subscription|annual fee|membership|premium|renewal/i, category: 'Subscriptions', weight: 0.85 },
      { pattern: /insurance|premium|policy|claim|coverage|lic|hdfc life|sbi life|icici prudential/i, category: 'Insurance', weight: 0.9 },
      { pattern: /salary|wage|compensation|credit to account|deposit|income|interest|dividend/i, category: 'Income', weight: 0.95 },
      { pattern: /emi|loan|mortgage|credit card|bajaj finance|muthoot/i, category: 'Debt/Loans', weight: 0.95 },
      { pattern: /investment|mutual fund|sip|zerodha|groww|upstox|angel one|ppf|nps/i, category: 'Investments', weight: 0.95 },
      { pattern: /tax|incometax|gst|tds/i, category: 'Taxes', weight: 0.95 },
    ];

    ruleDefinitions.forEach(rule => {
      this.addRule(rule.pattern, rule.category, rule.weight);
    });
  }

  addRule(pattern: RegExp, category: string, weight: number = 0.9) {
    this.rules.push({ pattern, category, weight });
  }

  learn(description: string, category: string) {
    const merchant = extractMerchant(description);

    if (!this.merchantMap.has(merchant)) {
      this.merchantMap.set(merchant, new Map());
    }

    const categoryCount = this.merchantMap.get(merchant)!;
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  }

  categorize(description: string, type: string): { category: string; confidence: number } {
    const descLower = description.toLowerCase();
    const merchant = extractMerchant(description);

    if (this.merchantMap.has(merchant)) {
      const categoryCount = this.merchantMap.get(merchant)!;
      const [learnedCategory, count] = [...categoryCount.entries()].reduce((a, b) => (a[1] > b[1] ? a : b));
      const confidence = count >= 3 ? 0.95 : 0.75;
      return { category: learnedCategory, confidence };
    }

    let bestMatch = { category: type === 'credit' ? 'Income' : 'Other', confidence: 0.3, weight: 0 };

    for (const rule of this.rules) {
      if (rule.pattern.test(descLower)) {
        if (rule.weight > bestMatch.weight) {
          bestMatch = { category: rule.category, confidence: rule.weight, weight: rule.weight };
        }
      }
    }

    if (bestMatch.confidence <= 0.3) {
      const fuzzyMatch = this.fuzzyMatchMerchant(merchant);
      if (fuzzyMatch) {
        return fuzzyMatch;
      }
    }

    return { category: bestMatch.category, confidence: bestMatch.confidence };
  }

  private fuzzyMatchMerchant(merchant: string): { category: string; confidence: number } | null {
    let bestMatch = null;
    let bestSimilarity = 0.6;

    for (const [knownMerchant, categoryCount] of this.merchantMap.entries()) {
      const similarity = stringSimilarity(merchant, knownMerchant);
      if (similarity > bestSimilarity) {
        const [category] = [...categoryCount.entries()].reduce((a, b) => (a[1] > b[1] ? a : b));
        bestMatch = { category, confidence: similarity };
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  export(): Record<string, Record<string, number>> {
    const data: Record<string, Record<string, number>> = {};
    for (const [merchant, categoryMap] of this.merchantMap.entries()) {
      data[merchant] = Object.fromEntries(categoryMap);
    }
    return data;
  }

  import(data: Record<string, Record<string, number>>) {
    for (const [merchant, categories] of Object.entries(data)) {
      const categoryMap = new Map<string, number>();
      for (const [category, count] of Object.entries(categories)) {
        categoryMap.set(category, count);
      }
      this.merchantMap.set(merchant, categoryMap);
    }
  }
}
