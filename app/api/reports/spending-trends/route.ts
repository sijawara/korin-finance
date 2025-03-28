import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

// Define the return type for the spending trends data
export type SpendingTrendsData = {
  // Data for spending by time period
  timeSeries: {
    labels: string[]; // Names of time periods (months, weeks, etc.)
    expenses: number[]; // Total expenses for each time period
    income: number[]; // Total income for each time period
  };
  // Top spending categories
  topCategories: {
    name: string;
    amount: number;
    percentage: number;
    transactions: number;
  }[];
  // Time-based insights
  insights: {
    fastestGrowingCategory: string;
    monthWithHighestSpending: string;
    averageMonthlySpending: number;
    changeFromPrevious: number; // Percentage change from previous period
  };
  // Overall total for the selected period
  totals: {
    totalExpenses: number;
    totalIncome: number;
    netSavings: number;
    savingsRate: number;
  };
  periodLabel: string;
};

// GET /api/reports/spending-trends - Fetch spending trend data
export async function GET(request: Request) {
  try {
    // Authentication check
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);
    const profile_id = decodedToken.uid;

    // Parse period from query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "this-month";

    // Calculate date range based on period
    const { startDate, endDate, periodLabel } = calculateDateRange(period);

    // Get time series data based on period length
    const timeSeriesResult = await getTimeSeriesData(
      profile_id,
      startDate,
      endDate,
      period
    );

    // Get top spending categories
    const topCategoriesResult = await db.query(
      `
      SELECT 
        c.name as category_name,
        ABS(SUM(t.amount)) as total_amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 
        t.profile_id = $1 AND 
        t.amount < 0 AND
        t.date >= $2 AND
        t.date <= $3
      GROUP BY c.name
      ORDER BY total_amount DESC
      LIMIT 5
      `,
      [profile_id, startDate, endDate]
    );

    // Calculate overall totals
    const totalsResult = await db.query(
      `
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
      FROM transactions
      WHERE 
        profile_id = $1 AND
        date >= $2 AND
        date <= $3
      `,
      [profile_id, startDate, endDate]
    );

    const totalIncome = parseFloat(totalsResult.rows[0]?.total_income || "0");
    const totalExpenses = parseFloat(
      totalsResult.rows[0]?.total_expenses || "0"
    );
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate previous period for comparison
    const previousPeriodDates = calculatePreviousPeriod(startDate, endDate);

    const previousTotalsResult = await db.query(
      `
      SELECT 
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
      FROM transactions
      WHERE 
        profile_id = $1 AND
        date >= $2 AND
        date <= $3
      `,
      [profile_id, previousPeriodDates.startDate, previousPeriodDates.endDate]
    );

    const previousTotalExpenses = parseFloat(
      previousTotalsResult.rows[0]?.total_expenses || "0"
    );

    // Calculate percentage change
    const changeFromPrevious =
      previousTotalExpenses > 0
        ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) *
          100
        : 0;

    // Find month with highest spending
    const monthlySpendingResult = await db.query(
      `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
      FROM transactions
      WHERE 
        profile_id = $1 AND
        date >= $2 AND
        date <= $3
      GROUP BY month
      ORDER BY total_expenses DESC
      LIMIT 1
      `,
      [profile_id, startDate, endDate]
    );

    // Format results for response
    // 1. Format time series data
    const { labels, expenses, income } = timeSeriesResult;

    // 2. Format top categories
    const topCategories = topCategoriesResult.rows.map((row) => {
      const amount = parseFloat(row.total_amount);
      return {
        name: row.category_name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        transactions: parseInt(row.transaction_count),
      };
    });

    // 3. Format insights
    const fastestGrowingCategory = topCategories[0]?.name || "None";
    const monthWithHighestSpending =
      monthlySpendingResult.rows[0]?.month ||
      new Date(endDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

    // Convert month format to readable format if we have data
    const highestSpendingMonth = monthlySpendingResult.rows[0]?.month
      ? new Date(monthlySpendingResult.rows[0].month + "-01").toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        )
      : monthWithHighestSpending;

    // Calculate average monthly spending
    const monthDiff = getMonthDifference(
      new Date(startDate),
      new Date(endDate)
    );
    const averageMonthlySpending =
      monthDiff > 0 ? totalExpenses / monthDiff : totalExpenses;

    // Construct the response
    const spendingTrends: SpendingTrendsData = {
      timeSeries: {
        labels,
        expenses,
        income,
      },
      topCategories,
      insights: {
        fastestGrowingCategory,
        monthWithHighestSpending: highestSpendingMonth,
        averageMonthlySpending,
        changeFromPrevious: Math.round(changeFromPrevious),
      },
      totals: {
        totalExpenses,
        totalIncome,
        netSavings,
        savingsRate: Math.round(savingsRate),
      },
      periodLabel,
    };

    return NextResponse.json({
      success: true,
      data: spendingTrends,
    });
  } catch (error) {
    console.error("Error generating spending trends:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate spending trends" },
      { status: 500 }
    );
  }
}

// Helper function to get time series data based on period
async function getTimeSeriesData(
  profileId: string,
  startDate: string,
  endDate: string,
  period: string
): Promise<{ labels: string[]; expenses: number[]; income: number[] }> {
  let format: string;
  let labels: string[] = [];

  // Determine grouping format based on period
  if (period === "this-month" || period === "last-month") {
    format = "YYYY-MM-DD"; // Daily breakdown for a month
    labels = generateDateLabels(startDate, endDate, "day");
  } else if (period === "last-3-months" || period === "last-6-months") {
    format = "YYYY-MM-W"; // Weekly breakdown
    labels = generateDateLabels(startDate, endDate, "week");
  } else {
    format = "YYYY-MM"; // Monthly breakdown for longer periods
    labels = generateDateLabels(startDate, endDate, "month");
  }

  // Query for time series data
  const result = await db.query(
    `
    SELECT 
      TO_CHAR(date, $4) as time_period,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
    FROM transactions
    WHERE 
      profile_id = $1 AND
      date >= $2 AND
      date <= $3
    GROUP BY time_period
    ORDER BY time_period
    `,
    [profileId, startDate, endDate, format]
  );

  // Map DB results to our time periods
  const timeSeriesMap = result.rows.reduce((acc, row) => {
    acc[row.time_period] = {
      expenses: parseFloat(row.expenses) || 0,
      income: parseFloat(row.income) || 0,
    };
    return acc;
  }, {});

  // Create arrays for expenses and income, filling gaps with zeros
  const expenses = labels.map((label) => timeSeriesMap[label]?.expenses || 0);
  const income = labels.map((label) => timeSeriesMap[label]?.income || 0);

  return { labels, expenses, income };
}

// Helper function to generate date labels
function generateDateLabels(
  startDate: string,
  endDate: string,
  interval: "day" | "week" | "month"
): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];

  // Function to format date as needed
  const formatDate = (date: Date): string => {
    if (interval === "day") {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    } else if (interval === "week") {
      // ISO week format YYYY-MM-W
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const weekNum = Math.ceil(date.getDate() / 7);
      return `${year}-${month}-W${weekNum}`;
    } else {
      // YYYY-MM for month
      return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    }
  };

  // Clone start date to avoid modifying it
  const current = new Date(start);

  // Generate labels based on interval
  while (current <= end) {
    labels.push(formatDate(current));

    if (interval === "day") {
      current.setDate(current.getDate() + 1);
    } else if (interval === "week") {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return labels;
}

// Helper function to calculate previous period
function calculatePreviousPeriod(
  startDate: string,
  endDate: string
): { startDate: string; endDate: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = end.getTime() - start.getTime();

  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousStart.getTime() - duration);

  return {
    startDate: previousStart.toISOString().split("T")[0],
    endDate: previousEnd.toISOString().split("T")[0],
  };
}

// Helper function to calculate months between two dates
function getMonthDifference(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1
  );
}

// Helper function to calculate date range based on period (same as in income-statement route)
function calculateDateRange(period: string): {
  startDate: string;
  endDate: string;
  periodLabel: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let startDate: Date;
  let endDate: Date = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let periodLabel: string;

  switch (period) {
    case "this-month":
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
      periodLabel = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      break;

    case "last-month":
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
      periodLabel = new Date(startDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      break;

    case "last-3-months":
      startDate = new Date(currentYear, currentMonth - 3, 1);
      periodLabel = `${new Date(startDate).toLocaleString("default", {
        month: "long",
      })} - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "last-6-months":
      startDate = new Date(currentYear, currentMonth - 6, 1);
      periodLabel = `${new Date(startDate).toLocaleString("default", {
        month: "long",
      })} - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "year-to-date":
      startDate = new Date(currentYear, 0, 1);
      periodLabel = `Jan - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "last-year":
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31);
      periodLabel = (currentYear - 1).toString();
      break;

    case "all-time":
      startDate = new Date(2000, 0, 1); // Arbitrary past date
      periodLabel = "All Time";
      break;

    default: // Custom date range would be handled directly with startDate and endDate params
      startDate = new Date(currentYear, currentMonth, 1);
      periodLabel = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    periodLabel,
  };
}
