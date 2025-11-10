import sql from "@/app/api/utils/sql";

// Get all expenses
export async function GET() {
  try {
    const expenses = await sql`
      SELECT * FROM expenses
      ORDER BY expense_date DESC
    `;

    return Response.json(expenses);
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
    const { category, description, amount, expense_date, notes } =
      await request.json();

    if (!category || !description || !amount) {
      return Response.json(
        { error: "Category, description, and amount are required" },
        { status: 400 },
      );
    }

    const [newExpense] = await sql`
      INSERT INTO expenses (category, description, amount, expense_date, notes)
      VALUES (${category}, ${description}, ${amount}, ${expense_date || "CURRENT_TIMESTAMP"}, ${notes})
      RETURNING *
    `;

    return Response.json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return Response.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}
