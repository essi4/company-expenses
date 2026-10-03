export type InvoiceStatus = "draft" | "review" | "final" | "paid";
export type EntryKind = "deposit" | "expense";
export type Currency = "IRT";

export interface PartyInfo {
  name: string;
  nationalId?: string;
  economicId?: string;
  phone?: string;
}

export interface InvoiceEntry {
  id: string;
  kind: EntryKind;
  date: string;
  description: string;
  amount: number; // integer amount in toman (IRT)
  receiptUrl?: string; // reserved for phase 2
}

export interface Invoice {
  id: string;
  documentNumber: string;
  issuedAt: string;
  status: InvoiceStatus;
  currency: Currency;
  title: string;
  seller: PartyInfo;
  buyer: PartyInfo;
  entries: InvoiceEntry[];
}

export interface InvoiceTotals {
  totalDeposit: number;
  totalExpense: number;
  balance: number;
}

export function calculateInvoiceTotals(entries: InvoiceEntry[]): InvoiceTotals {
  const totalDeposit = entries
    .filter((entry) => entry.kind === "deposit")
    .reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.amount)), 0);

  const totalExpense = entries
    .filter((entry) => entry.kind === "expense")
    .reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.amount)), 0);

  return {
    totalDeposit,
    totalExpense,
    balance: Math.max(totalExpense - totalDeposit, 0),
  };
}
