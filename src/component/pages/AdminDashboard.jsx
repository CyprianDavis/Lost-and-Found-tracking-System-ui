import React, { useMemo, useState } from "react";
import "./AdminDashboard.css";
import {
  HelpCircle,
  Search,
  Undo2,
  FileQuestion,
  Users,
  Package,
  Bell,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useApiList } from "../../hooks/useApiList";

export default function AdminDashboard() {
  const [barHalf, setBarHalf] = useState("first"); // "first" or "last"
  const [selectedYear] = useState(new Date().getFullYear().toString());

  const { data: lostReports = [] } = useApiList("/api/v1/lost-reports", {
    size: 500,
  });
  const { data: foundReports = [] } = useApiList("/api/v1/found-reports", {
    size: 500,
  });
  const { data: claims = [] } = useApiList("/api/v1/claims", {
    size: 500,
  });

  const lostFoundStats = useMemo(() => {
    const totalLost = lostReports.length;
    const totalFound = foundReports.length;
    const returned = claims.filter((c) => c.status === "APPROVED").length;
    const unmatchedFound = foundReports.filter(
      (fr) => fr.status === "AVAILABLE" || fr.status === "CLAIM_PENDING",
    ).length;
    return [
      {
        title: "Lost Items",
        value: totalLost,
        change: "",
        icon: <HelpCircle className="w-6 h-6 text-red-500" />,
        trend: "up",
      },
      {
        title: "Found Items",
        value: totalFound,
        change: "",
        icon: <Search className="w-6 h-6 text-blue-500" />,
        trend: "up",
      },
      {
        title: "Returned Items",
        value: returned,
        change: "",
        icon: <Undo2 className="w-6 h-6 text-green-500" />,
        trend: "up",
      },
      {
        title: "Unmatched Found Items",
        value: unmatchedFound,
        change: "",
        icon: <FileQuestion className="w-6 h-6 text-gray-500" />,
        trend: unmatchedFound > 0 ? "up" : "down",
      },
    ];
  }, [lostReports, foundReports, claims]);

  const allMonths = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, idx) => ({
      month: new Date(0, idx).toLocaleString("default", { month: "short" }),
      lost: 0,
      found: 0,
      returned: 0,
      categories: {},
    }));
    lostReports.forEach((lr) => {
      if (!lr.dateLost) return;
      const m = new Date(lr.dateLost).getMonth();
      months[m].lost += 1;
      const cat = lr.item?.category || "Other";
      months[m].categories[cat] = (months[m].categories[cat] || 0) + 1;
    });
    foundReports.forEach((fr) => {
      if (!fr.dateFound) return;
      const m = new Date(fr.dateFound).getMonth();
      months[m].found += 1;
      if (fr.status === "CLAIMED") {
        months[m].returned += 1;
      }
      const cat = fr.item?.category || "Other";
      months[m].categories[cat] = (months[m].categories[cat] || 0) + 1;
    });
    claims.forEach((c) => {
      if (c.status === "APPROVED" && c.updatedAt) {
        const m = new Date(c.updatedAt).getMonth();
        months[m].returned += 1;
      }
    });
    return months;
  }, [lostReports, foundReports, claims]);
  const monthsFirstHalf = allMonths.slice(0, 6);
  const monthsLastHalf = allMonths.slice(6);

  // Only the bar chart data is affected by combo box
  const displayedBarMonths =
    barHalf === "first" ? monthsFirstHalf : monthsLastHalf;

  // Pie and Line charts always show all months
  const lostCategoryData = useMemo(() => {
    const categoryTotals = {};
    allMonths.forEach((m) => {
      Object.entries(m.categories || {}).forEach(([name, count]) => {
        categoryTotals[name] = (categoryTotals[name] || 0) + count;
      });
    });
    const entries = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
    return entries.length > 0
      ? entries
      : [{ name: "No data", value: 1 }];
  }, [allMonths]);
  const CATEGORY_COLORS = [
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#a855f7", // Purple
    "#ef4444", // Red
  ];

  const returnedTrend = allMonths.map((m) => ({
    month: m.month,
    returned: m.returned,
  }));

  const activityList = useMemo(() => {
    const now = Date.now();
    const toAgo = (dateStr) => {
      if (!dateStr) return "Just now";
      const ms = now - new Date(dateStr).getTime();
      const mins = Math.max(1, Math.floor(ms / 60000));
      if (mins < 60) return `${mins} min ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    };

    const events = [];
    lostReports.slice(0, 50).forEach((lr) => {
      events.push({
        type: "lost",
        at: lr.updatedAt || lr.createdAt,
        icon: <HelpCircle className="activity-item-icon" />,
        description: `Lost reported: ${lr.referenceCode || `Lost #${lr.id}`}`,
      });
    });
    foundReports.slice(0, 50).forEach((fr) => {
      events.push({
        type: "found",
        at: fr.updatedAt || fr.createdAt,
        icon: <Search className="activity-item-icon" />,
        description: `Found reported: ${fr.referenceCode || `Found #${fr.id}`}`,
      });
    });
    claims.slice(0, 50).forEach((c) => {
      events.push({
        type: "claim",
        at: c.updatedAt || c.createdAt,
        icon: c.status === "APPROVED"
          ? <Undo2 className="activity-item-icon" />
          : <FileQuestion className="activity-item-icon" />,
        description: `Claim #${c.id} is ${c.status}`,
      });
    });

    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 8)
      .map((e) => ({
        ...e,
        time: toAgo(e.at),
      }));
  }, [lostReports, foundReports, claims]);

  return (
    <div className="admin-dashboard">
      {/* Widgets */}
      <div className="widgets-container">
        {lostFoundStats.map((widget, idx) => (
          <div key={idx} className="widget">
            <div className="widget-header">
              <h3>{widget.title}</h3>
              <span className="widget-icon">{widget.icon}</span>
            </div>
            <div className="widget-value">{widget.value}</div>
            <div
              className={`widget-change ${
                widget.trend === "up" ? "positive" : "negative"
              }`}
            >
              {widget.trend === "up" ? (
                <TrendingUp className="trend-icon" />
              ) : (
                <TrendingDown className="trend-icon" />
              )}
              {widget.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="chart-container">
        <div className="primary-chart">
          <div className="chart-card">
            <div
              className="chart-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>Lost vs Found Items ({selectedYear})</h3>
              {/* Combo box inside bar chart */}
              <select
                className="chart-select"
                value={barHalf}
                style={{
                  padding: 6,
                  fontSize: 16,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
                onChange={(e) => setBarHalf(e.target.value)}
              >
                <option value="first">First 6 Months</option>
                <option value="last">Last 6 Months</option>
              </select>
            </div>
            <div className="sales-purchases-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayedBarMonths}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="lost"
                    fill="#ef4444"
                    name="Lost"
                    radius={[6, 6, 0, 0]}
                    barSize={25}
                  />
                  <Bar
                    dataKey="found"
                    fill="#3b82f6"
                    name="Found"
                    radius={[6, 6, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="secondary-chart">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Lost Items by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={lostCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {lostCategoryData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="chart-container">
        <div className="primary-chart">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Returned Items Trend ({selectedYear})</h3>
            </div>
            <div className="sales-purchases-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={returnedTrend}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="returned"
                    name="Returned"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="secondary-chart">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Activity Overview</h3>
            </div>
            <div className="chart-placeholder">
              <Package className="chart-icon" />
              <p>Summary of item activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-header">
          <h3>Recent Activity</h3>
          <Bell className="activity-icon" />
        </div>
        <ul>
          {activityList.map((activity, idx) => (
            <li key={idx}>
              {activity.icon}
              <div className="activity-info">
                <p>{activity.description}</p>
                <span>{activity.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
