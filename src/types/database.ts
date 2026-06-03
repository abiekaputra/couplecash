// Database row types. Matches supabase/schema.sql one-to-one.
// Regenerate with `supabase gen types typescript` if the schema drifts.

export type Role = "admin" | "member";

export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "food"
  | "shop"
  | "transport"
  | "fun"
  | "bills"
  | "saving";

export type IncomeCategory = "income" | "saving";

export type Category = ExpenseCategory | IncomeCategory;

export interface Couple {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  couple_id: string;
  username: string;
  display_name: string;
  role: Role;
  avatar_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  couple_id: string;
  user_id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingGoal {
  id: string;
  couple_id: string;
  title: string;
  target_amount: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringTemplate {
  id: string;
  couple_id: string;
  user_id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note: string | null;
  day_of_month: number;
  active: boolean;
  last_run_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "display_name" | "avatar_color">
>;

export type TransactionInsert = {
  couple_id: string;
  user_id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note?: string | null;
  transaction_date?: string;
  created_by?: string | null;
};

export type TransactionUpdate = Partial<
  Pick<
    Transaction,
    "type" | "category" | "amount" | "note" | "transaction_date"
  >
>;

export type SavingGoalUpdate = Partial<
  Pick<SavingGoal, "title" | "target_amount">
>;

export type RecurringTemplateInsert = {
  couple_id: string;
  user_id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note?: string | null;
  day_of_month: number;
  active?: boolean;
  created_by: string;
};

export type RecurringTemplateUpdate = Partial<
  Pick<
    RecurringTemplate,
    | "type"
    | "category"
    | "amount"
    | "note"
    | "day_of_month"
    | "active"
    | "user_id"
  >
>;

export interface Database {
  public: {
    Tables: {
      couples: {
        Row: Couple;
        Insert: Omit<Couple, "id" | "created_at"> & { id?: string };
        Update: Partial<Couple>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: Partial<Transaction>;
        Relationships: [];
      };
      saving_goal: {
        Row: SavingGoal;
        Insert: Omit<SavingGoal, "id" | "created_at" | "updated_at">;
        Update: Partial<SavingGoal>;
        Relationships: [];
      };
      recurring_templates: {
        Row: RecurringTemplate;
        Insert: RecurringTemplateInsert;
        Update: Partial<RecurringTemplate>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "shop", label: "Shop" },
  { value: "transport", label: "Transport" },
  { value: "fun", label: "Fun" },
  { value: "bills", label: "Bills" },
  { value: "saving", label: "Saving" },
];
