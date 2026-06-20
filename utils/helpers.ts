import { saveAs } from 'file-saver';
import { Transaction, MonthlyExpense } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const formatCurrency = (amount: number, currency: string = 'INR', maximumFractionDigits: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits,
  }).format(amount);
};

export const formatNumberAbbreviated = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1)} L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} K`;
  }
  return num.toFixed(0);
};

// Tableau 10 Color Palette - professional and colorblind-friendly
const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

export const getCategoryColor = (category: string): string => {
  // A special, consistent color for income.
  if (category === 'Income') {
      return '#22c55e'; 
  }
  
  // Simple hashing function to get a consistent index for a category.
  // This ensures that the same category always gets the same color.
  let hash = 0;
  if (category.length === 0) return COLORS[0];
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer to keep it in a manageable range.
  }
  
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

// Function to get month name from YYYY-MM format
export const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthName = date.toLocaleString('default', { month: 'short' });
  const shortYear = year.slice(-2);
  return `${monthName} '${shortYear}`;
};

export const getDDMM = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  return `${day}${month}`;
};

/**
 * Fetches and embeds stylesheets, then creates an image from a DOM element.
 * This function creates a self-contained SVG with styles and HTML, converts it to a data URL
 * to avoid canvas tainting from cross-origin resources.
 * @param {HTMLElement} element - The DOM element to convert to an image.
 * @param {string} allCss - A string containing all the CSS rules for styling.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element.
 */
const elementToImage = (element: HTMLElement, allCss: string): Promise<HTMLImageElement> => {
    const { width, height } = element.getBoundingClientRect();

    // Use outerHTML to get the full element markup.
    const htmlString = new XMLSerializer().serializeToString(element);

    // Embed styles and HTML into a self-contained SVG using <foreignObject>.
    const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <style>${allCss}</style>
            <foreignObject x="0" y="0" width="100%" height="100%">
                ${htmlString}
            </foreignObject>
        </svg>
    `;

    // Create a data URL from the SVG. This is crucial for avoiding the "tainted canvas" error.
    // A data URL is self-contained and not subject to cross-origin restrictions.
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error('Failed to load SVG data URL into image:', err);
            reject(new Error('Image loading from data URL failed.'));
        };
        img.src = dataUrl;
    });
};


/**
 * Copies the visual representation of charts within a given container to the clipboard as a single PNG image.
 * @param {HTMLElement | null} element - The container element holding the charts.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on failure.
 */
export const copyChartsToClipboard = async (element: HTMLElement | null): Promise<boolean> => {
    if (!element) {
        console.error("Chart container element not found.");
        return false;
    }

    const chartWrappers = Array.from(element.querySelectorAll<HTMLDivElement>(':scope > div'));
    
    if (chartWrappers.length === 0) {
        console.error("No chart components found to copy.");
        return false;
    }

    try {
        // Step 1: Fetch all stylesheets, including cross-origin ones, to ensure correct styling.
        const stylePromises = Array.from(document.styleSheets).map(async (sheet) => {
            try {
                if (sheet.href) {
                    const response = await fetch(sheet.href); // Let it fail if no CORS
                    return await response.text();
                }
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
            } catch (e) {
                console.warn(`Could not process stylesheet: ${sheet.href || 'inline'}`, e);
                return '';
            }
        });
        const allCss = (await Promise.all(stylePromises)).join('\n');

        // Step 2: Convert each chart wrapper element into an image.
        const images = await Promise.all(
            chartWrappers.map(wrapper => elementToImage(wrapper, allCss))
        );

        // Step 3: Draw all the generated images onto a single canvas.
        const scale = 2; // Use a higher scale for better resolution.
        const padding = 20 * scale;
        const gap = 20 * scale;

        const canvas = document.createElement('canvas');
        const maxWidth = Math.max(...images.map(img => img.width));
        const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

        canvas.width = maxWidth * scale + padding * 2;
        canvas.height = (totalHeight * scale) + (padding * 2) + (images.length - 1) * gap;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Could not get canvas context.");
        }

        ctx.fillStyle = '#f8fafc'; // Match the app's background color (bg-slate-50).
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = padding;
        for (const img of images) {
            ctx.drawImage(img, padding, currentY, img.width * scale, img.height * scale);
            currentY += img.height * scale + gap;
        }

        // Step 4: Convert the canvas to a blob and write to clipboard.
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            throw new Error('Canvas toBlob conversion failed.');
        }

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        
        return true;
    } catch (error) {
        console.error('Failed to copy charts to clipboard:', error);
        return false;
    }
};
