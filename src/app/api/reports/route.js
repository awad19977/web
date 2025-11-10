import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

// Get financial reports and analytics
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.REPORTS);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get sales data
    const salesData = await sql`
      SELECT 
        DATE(sale_date) as date,
        SUM(total_amount) as revenue,
        SUM(quantity) as units_sold,
        COUNT(*) as transactions
      FROM sales 
      WHERE sale_date >= ${startDate.toISOString()}
      GROUP BY DATE(sale_date)
      ORDER BY date DESC
    `;

    // Get expenses data
    const expensesData = await sql`
      SELECT 
        DATE(expense_date) as date,
        SUM(amount) as total_expenses,
        category,
        COUNT(*) as expense_count
      FROM expenses 
      WHERE expense_date >= ${startDate.toISOString()}
      GROUP BY DATE(expense_date), category
      ORDER BY date DESC
    `;

    // Get stock purchases data
    const purchasesData = await sql`
      SELECT 
        DATE(purchase_date) as date,
        SUM(total_cost) as total_purchases,
        COUNT(*) as purchase_count
      FROM stock_purchases 
      WHERE purchase_date >= ${startDate.toISOString()}
      GROUP BY DATE(purchase_date)
      ORDER BY date DESC
    `;

    // Calculate totals
    const totalRevenue = salesData.reduce(
      (sum, day) => sum + parseFloat(day.revenue || 0),
      0,
    );
    const totalExpenses = expensesData.reduce(
      (sum, day) => sum + parseFloat(day.total_expenses || 0),
      0,
    );
    const totalPurchases = purchasesData.reduce(
      (sum, day) => sum + parseFloat(day.total_purchases || 0),
      0,
    );
    const totalCosts = totalExpenses + totalPurchases;
    const netProfit = totalRevenue - totalCosts;

    // Get current stock value
    const stockValue = await sql`
      SELECT SUM(current_quantity * unit_cost) as total_stock_value
      FROM stock
    `;

    // Get top selling products
    const topProducts = await sql`
      SELECT 
        p.name,
        SUM(s.quantity) as total_sold,
        SUM(s.total_amount) as total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.sale_date >= ${startDate.toISOString()}
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `;

    return Response.json({
      period: parseInt(period),
      summary: {
        totalRevenue,
        totalExpenses,
        totalPurchases,
        totalCosts,
        netProfit,
        stockValue: parseFloat(stockValue[0]?.total_stock_value || 0),
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      },
      salesData,
      expensesData,
      purchasesData,
      topProducts,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
