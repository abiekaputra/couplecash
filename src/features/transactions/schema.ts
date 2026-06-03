import { z } from "zod";

// user_id intentionally excluded — resolved server-side in actions.ts
const baseShape = z.object({
  type: z.enum(["income", "expense"]),
  category: z.enum(["income", "food", "shop", "transport", "fun", "bills", "saving"]),
  amount: z
    .string()
    .min(1, "Amount is required")
    .transform((v) => Number(v.replace(/[^0-9]/g, "")))
    .pipe(z.number().min(1, "Amount must be greater than 0")),
  note: z.string().max(200).optional().or(z.literal("")),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  // target_user_id: opaque string — we verify it exists in the couple on the server
  target_user_id: z.string().min(1, "User required"),
});

function addTypeConsistency<T extends typeof baseShape>(schema: T) {
  return schema.superRefine((data, ctx) => {
    if (data.type === "income" && !["income", "saving"].includes(data.category)) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Income must use category Income or Saving",
      });
    }
    if (data.type === "expense" && data.category === "income") {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Expense cannot use Income category",
      });
    }
  });
}

export const transactionSchema = addTypeConsistency(baseShape);

// .partial() on the base (no superRefine), then add id
export const updateTransactionSchema = baseShape.partial().extend({
  id: z.string().min(1, "ID required"),
});

export type TransactionFormInput = z.input<typeof transactionSchema>;
export type TransactionFormData = z.output<typeof transactionSchema>;
