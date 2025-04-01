export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  tax_amount?: number;
  status: string;
  notes?: string;
  category_id?: string;
  created_at: Date;
  updated_at: Date;
  // Join fields
  category_name?: string;
  category_color?: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
}
