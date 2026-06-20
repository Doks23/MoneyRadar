import { CategorizationRule, Transaction } from '../types';
import { FuzzyCategor } from './statementParser';

/**
 * Finds a category based on the description by checking against a list of rules.
 * @param description The transaction description.
 * @param rules The list of categorization rules.
 * @returns The matching category or null if no match is found.
 */
export const getCategoryByDescription = (description: string, rules: CategorizationRule[]): string | null => {
  if (!description) {
    return null;
  }
  
  const fuzzyRules = rules.map(r => ({
    pattern: new RegExp(r.keyword, 'i'),
    category: r.category
  }));
  
  const categorizer = new FuzzyCategor(fuzzyRules);
  const { category, confidence } = categorizer.categorize(description, 'unknown');
  
  // Only return if we have a reasonable confidence, otherwise return null
  if (confidence > 0.3 && category !== 'Other') {
      return category;
  }
  
  return null;
};

/**
 * Applies categorization rules to a list of transactions.
 * It skips any transaction that has been manually edited.
 * @param transactions The list of transactions to process.
 * @param rules The categorization rules to apply.
 * @returns A new array of transactions with updated categories.
 */
export const applyRulesToTransactions = (transactions: Transaction[], rules: CategorizationRule[]): Transaction[] => {
  const fuzzyRules = rules.map(r => ({
    pattern: new RegExp(r.keyword, 'i'),
    category: r.category
  }));
  
  const categorizer = new FuzzyCategor(fuzzyRules);

  return transactions.map(tx => {
    // If the transaction has been manually edited, don't touch it.
    if (tx.isManuallyEdited) {
      return tx;
    }

    const { category } = categorizer.categorize(tx.description, tx.type);
    
    // If a rule matches and the category is different, update it.
    if (category && category !== tx.category) {
      return { ...tx, category: category };
    }

    return tx;
  });
};