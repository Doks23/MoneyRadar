import { Transaction, MonthlyExpense } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const exportTransactionsToCSV = (transactions: Transaction[], filename: string) => {
  const headers = ['id', 'date', 'description', 'amount', 'category', 'bankName', 'currency', 'sourceFile'];
  const csvRows = [
    headers.join(','),
    ...transactions.map(tx => {
      const values = headers.map(header => {
        const value = tx[header as keyof Transaction];
        if (typeof value === 'string') {
          // Escape double quotes and wrap in double quotes if it contains commas
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        }
        return value;
      });
      return values.join(',');
    })
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const exportAggregatedToCSV = (monthlyExpenses: MonthlyExpense[], filename: string) => {
  const headers = ['Month', 'Category', 'Amount'];
  const csvRows = [headers.join(',')];

  monthlyExpenses.forEach(monthData => {
    monthData.expenses.forEach(expense => {
      const row = [
        `"${monthData.month}"`,
        `"${expense.category.replace(/"/g, '""')}"`,
        expense.amount
      ].join(',');
      csvRows.push(row);
    });
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const parseImportedTransactions = (fileContent: string, sourceFile: string): Transaction[] => {
    // Check if it's JSON first
    try {
        const data = JSON.parse(fileContent);
        if (Array.isArray(data) && data.length > 0 && 'description' in data[0] && 'amount' in data[0]) {
            return data.map(item => ({...item, id: item.id || uuidv4(), sourceFile: sourceFile }));
        }
    } catch (e) {
      // Not a valid JSON, proceed to check for CSV
    }

    // Assume CSV
    try {
        const lines = fileContent.split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, ''));
        const requiredHeaders = ['date', 'description', 'amount', 'category', 'bankName'];
        if(!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error('CSV file is missing required headers (date, description, amount, category, bankName).');
        }

        return lines.slice(1).map(line => {
            if (line.trim() === '') return null;
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const transactionData: any = {};
            headers.forEach((header, index) => {
                const value = (values[index] || '').replace(/"/g, '');
                transactionData[header] = header === 'amount' ? parseFloat(value) : value;
            });
            transactionData.id = transactionData.id || uuidv4();
            transactionData.sourceFile = sourceFile;
            return transactionData as Transaction;
        }).filter((tx): tx is Transaction => tx !== null && tx.description && !isNaN(tx.amount)); // Basic validation

    } catch (error) {
         throw new Error('Failed to parse the imported file. Please ensure it is a valid JSON or CSV exported from this application.');
    }
}