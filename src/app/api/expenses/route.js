import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

const formatExpenseRow = (row) => ({
  ...row,
  amount: Number(row.amount ?? 0),
  expense_date: row.expense_date
    ? new Date(row.expense_date).toISOString()
    : null,
});

// Get all expenses
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.EXPENSES);
    if (response) return response;

    const expenses = await sql`
      SELECT id, category, description, amount, notes, expense_date
      FROM expenses
      ORDER BY expense_date DESC, created_at DESC
    `;

    return Response.json({
      expenses: expenses.map(formatExpenseRow),
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return Response.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

// Create new expense
export async function POST(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.EXPENSES);
    if (response) return response;

    const body = await request.json();
    const category = String(body?.category ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const amountInput = body?.amount;
    const notes = body?.notes ? String(body.notes).trim() : null;
    const expenseDateInput = body?.expense_date;

    if (!category) {
      return Response.json(
        { error: "Category is required" },
        { status: 400 },
      );
    }

    if (!description) {
      return Response.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    let expenseDate = new Date();
    if (expenseDateInput) {
      const parsed = new Date(expenseDateInput);
      if (Number.isNaN(parsed.getTime())) {
        return Response.json(
          { error: "Enter a valid expense date" },
          { status: 400 },
        );
      }
      expenseDate = parsed;
    }

    const expenseDateIso = expenseDate.toISOString();

    const [newExpense] = await sql`
      INSERT INTO expenses (category, description, amount, expense_date, notes)
      VALUES (${category}, ${description}, ${amount}, ${expenseDateIso}, ${notes})
      RETURNING id, category, description, amount, notes, expense_date
    `;

    return Response.json(
      { expense: formatExpenseRow(newExpense) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    return Response.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}
