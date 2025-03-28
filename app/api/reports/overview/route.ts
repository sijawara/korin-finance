import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

// Define the return type for the financial overview data
export type FinancialOverviewData = {
  // Financial health metrics
  financialHealth: {
    score: number;
    description: string;
    netIncome: number;
    savingsRate: number;
    expenseToIncomeRatio: number;
    monthlyChange: number;
    budgetStatus: string;
  };

  // Income metrics
  incomeMetrics: {
    totalIncome: number;
    incomeToExpenseRatio: number;
    disposableIncome: number;
    incomeSources: number;
    primarySourcePercentage: number;
  };

  // Spending metrics
  spendingMetrics: {
    totalExpenses: number;
    dailyAverage: number;
    volatility: number;
    topCategory: {
      name: string;
      percentage: number;
    };
    categoriesCount: number;
  };

  // Income vs Expenses time series data
  timeSeries: {
    labels: string[]; // Time periods (days, weeks, or months)
    income: number[]; // Income data points
    expenses: number[]; // Expense data points
  };

  // Action recommendations
  recommendations: {
    shouldIncreaseSavings: boolean;
    shouldImproveIncomeOutflow: boolean;
    shouldBudget: boolean;
    shouldDiversifyIncome: boolean;
    shouldInvest: boolean;
  };

  // Time period information
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
};

// GET /api/reports/overview - Fetch comprehensive financial overview data
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

    // Get income data
    const incomeResult = await db.query(
      `
      SELECT 
        c.name as category,
        SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 
        t.profile_id = $1 AND 
        t.amount > 0 AND
        t.date >= $2 AND
        t.date <= $3
      GROUP BY c.name
      ORDER BY total_amount DESC
      `,
      [profile_id, startDate, endDate]
    );

    // Get expense data
    const expenseResult = await db.query(
      `
      SELECT 
        c.name as category,
        ABS(SUM(t.amount)) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 
        t.profile_id = $1 AND 
        t.amount < 0 AND
        t.date >= $2 AND
        t.date <= $3
      GROUP BY c.name
      ORDER BY total_amount DESC
      `,
      [profile_id, startDate, endDate]
    );

    // Get time series data for spending volatility calculation
    const timeSeriesResult = await db.query(
      `
      SELECT 
        TO_CHAR(date, 'YYYY-MM-DD') as day,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions
      WHERE 
        profile_id = $1 AND
        date >= $2 AND
        date <= $3
      GROUP BY day
      ORDER BY day
      `,
      [profile_id, startDate, endDate]
    );

    // Get previous period data for comparison
    const previousPeriodDates = calculatePreviousPeriod(startDate, endDate);

    const previousExpenseResult = await db.query(
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

    // Calculate basic metrics
    const totalIncome = incomeResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount),
      0
    );

    const totalExpenses = expenseResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount),
      0
    );

    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    const expenseToIncomeRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    const incomeToExpenseRatio =
      totalIncome > 0 ? totalIncome / totalExpenses : 0;
    const disposableIncome = netIncome;
    const dailyAverage = calculateDailyAverage(
      totalExpenses,
      startDate,
      endDate
    );
    const incomeSources = incomeResult.rows.length;
    const primarySourcePercentage =
      incomeSources > 0 && totalIncome > 0
        ? (parseFloat(incomeResult.rows[0]?.total_amount || "0") /
            totalIncome) *
          100
        : 0;

    // Calculate expense volatility
    const expenseValues = timeSeriesResult.rows.map((row) =>
      parseFloat(row.expenses)
    );
    const volatility = calculateVariance(expenseValues);

    // Get top spending category
    const topCategory =
      expenseResult.rows.length > 0
        ? {
            name: expenseResult.rows[0].category,
            percentage:
              totalExpenses > 0
                ? (parseFloat(expenseResult.rows[0].total_amount) /
                    totalExpenses) *
                  100
                : 0,
          }
        : { name: "N/A", percentage: 0 };

    // Calculate monthly change percentage
    const previousTotalExpenses = parseFloat(
      previousExpenseResult.rows[0]?.total_expenses || "0"
    );
    const monthlyChange =
      previousTotalExpenses > 0
        ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) *
          100
        : 0;

    // Determine budget status
    const budgetStatus = monthlyChange < 10 ? "On track" : "Needs attention";

    // Calculate financial health score
    const financialHealthScore = calculateFinancialHealthScore(
      savingsRate,
      expenseToIncomeRatio,
      volatility,
      disposableIncome
    );

    // Generate recommendations
    const recommendations = {
      shouldIncreaseSavings: savingsRate < 20,
      shouldImproveIncomeOutflow: disposableIncome <= 0,
      shouldBudget: monthlyChange > 10,
      shouldDiversifyIncome: incomeSources === 1,
      shouldInvest:
        savingsRate >= 20 &&
        disposableIncome > 0 &&
        monthlyChange <= 10 &&
        incomeSources > 1,
    };

    // Get time series data based on period length
    const timeSeriesData = await getTimeSeriesData(
      profile_id,
      startDate,
      endDate,
      period
    );

    // Construct the response
    const overview: FinancialOverviewData = {
      financialHealth: {
        score: financialHealthScore,
        description: getHealthScoreDescription(financialHealthScore),
        netIncome,
        savingsRate,
        expenseToIncomeRatio,
        monthlyChange,
        budgetStatus,
      },
      incomeMetrics: {
        totalIncome,
        incomeToExpenseRatio,
        disposableIncome,
        incomeSources,
        primarySourcePercentage,
      },
      spendingMetrics: {
        totalExpenses,
        dailyAverage,
        volatility,
        topCategory,
        categoriesCount: expenseResult.rows.length,
      },
      timeSeries: timeSeriesData,
      recommendations,
      period: {
        startDate,
        endDate,
        label: periodLabel,
      },
    };

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error generating financial overview:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate financial overview" },
      { status: 500 }
    );
  }
}

// Helper function to calculate date range based on period
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

// Helper function to calculate variance (as a percentage of mean)
function calculateVariance(numbers: number[]): number {
  if (numbers.length <= 1) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  if (mean === 0) return 0;

  const variance =
    numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) /
    numbers.length;
  const stdDev = Math.sqrt(variance);

  // Return coefficient of variation (std dev / mean) as a percentage
  return (stdDev / mean) * 100;
}

// Calculate a simplified financial health score
function calculateFinancialHealthScore(
  savingsRate: number,
  expenseRatio: number,
  volatility: number,
  disposableIncome: number
): number {
  // Weight each factor appropriately
  let score = 0;

  // Savings rate - 40% of score (0-40 points)
  score += Math.min(40, savingsRate * 2);

  // Expense ratio - 30% of score (0-30 points)
  score += Math.max(0, 30 - expenseRatio * 0.3);

  // Low volatility - 15% of score (0-15 points)
  score += Math.max(0, 15 - volatility * 0.5);

  // Positive disposable income - 15% of score (0-15 points)
  score +=
    disposableIncome > 0 ? 15 : Math.max(0, 15 + disposableIncome / 1000);

  // Round and ensure range is 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Calculate daily average spending
function calculateDailyAverage(
  expenses: number,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  return expenses / days;
}

// Get description based on health score
function getHealthScoreDescription(score: number): string {
  if (score >= 80) return "Excellent financial health";
  if (score >= 60) return "Good financial position";
  if (score >= 40) return "Fair financial condition";
  return "Needs immediate attention";
}

// Helper function to get time series data based on period
async function getTimeSeriesData(
  profileId: string,
  startDate: string,
  endDate: string,
  period: string
): Promise<{ labels: string[]; expenses: number[]; income: number[] }> {
  let format: string;
  let interval: "day" | "week" | "month";

  // Determine grouping format based on period
  if (period === "this-month" || period === "last-month") {
    format = "YYYY-MM-DD"; // Daily breakdown for a month
    interval = "day";
  } else if (period === "last-3-months" || period === "last-6-months") {
    format = "YYYY-MM-W"; // Weekly breakdown
    interval = "week";
  } else {
    format = "YYYY-MM"; // Monthly breakdown for longer periods
    interval = "month";
  }

  // Generate date labels based on the interval
  const labels = generateDateLabels(startDate, endDate, interval);

  // Query database for time series data
  const timeSeriesResult = await db.query(
    `
    SELECT 
      TO_CHAR(date, $4) as time_period,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
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

  // Initialize arrays with zeros to ensure all labels have data
  const income = Array(labels.length).fill(0);
  const expenses = Array(labels.length).fill(0);

  // Fill in the data from the query results
  timeSeriesResult.rows.forEach((row) => {
    const index = labels.indexOf(row.time_period);
    if (index !== -1) {
      income[index] = parseFloat(row.income || 0);
      expenses[index] = parseFloat(row.expenses || 0);
    }
  });

  return { labels, income, expenses };
}

// Function to generate date labels
function generateDateLabels(
  startDate: string,
  endDate: string,
  interval: "day" | "week" | "month"
): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];

  const formatDate = (date: Date): string => {
    if (interval === "day") {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    } else if (interval === "week") {
      // Get ISO week number (1-53)
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to Thursday of current week
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
      );
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-W${weekNum}`;
    } else {
      // Month format YYYY-MM
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    }
  };

  let current = new Date(start);

  while (current <= end) {
    labels.push(formatDate(current));

    if (interval === "day") {
      const nextDay = new Date(current);
      nextDay.setDate(nextDay.getDate() + 1);
      current = nextDay;
    } else if (interval === "week") {
      const nextWeek = new Date(current);
      nextWeek.setDate(nextWeek.getDate() + 7);
      current = nextWeek;
    } else {
      const nextMonth = new Date(current);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      current = nextMonth;
    }
  }

  return labels;
}
