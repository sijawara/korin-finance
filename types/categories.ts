export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  description?: string;
  parent_id?: string;
  is_parent: boolean;
  created_at: Date;
  updated_at: Date;
  usage_count?: number;
}
