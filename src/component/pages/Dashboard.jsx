import React, { useState } from 'react';
import './Dashboard.css';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Activity,
  Users,
  Package,
  Bell
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
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNextSix, setShowNextSix] = useState(false);

  // Widgets data
  const widgetData = [
    { title: "Total Sales", value: "$86,420", change: "+15.2%", icon: <BarChart3 className="w-6 h-6 text-green-500" />, trend: "up" },
    { title: "Total Expenses", value: "$42,150", change: "+8.3%", icon: <CreditCard className="w-6 h-6 text-red-500" />, trend: "up" },
    { title: "Payments Sent", value: "$28,640", change: "-5.1%", icon: <ArrowUpCircle className="w-6 h-6 text-yellow-500" />, trend: "down" },
    { title: "Payments Received", value: "$78,350", change: "+12.7%", icon: <ArrowDownCircle className="w-6 h-6 text-blue-500" />, trend: "up" }
  ];

  // Bar chart data (Sales vs Purchases)
  const firstSixMonths = [
    { month: 'Jan', sales: 4000, purchases: 2400 },
    { month: 'Feb', sales: 3000, purchases: 1398 },
    { month: 'Mar', sales: 2000, purchases: 9800 },
    { month: 'Apr', sales: 2780, purchases: 3908 },
    { month: 'May', sales: 1890, purchases: 4800 },
    { month: 'Jun', sales: 2390, purchases: 3800 },
  ];

  const nextSixMonths = [
    { month: 'Jul', sales: 3490, purchases: 4300 },
    { month: 'Aug', sales: 4200, purchases: 2100 },
    { month: 'Sep', sales: 3100, purchases: 2900 },
    { month: 'Oct', sales: 4700, purchases: 3500 },
    { month: 'Nov', sales: 3900, purchases: 3000 },
    { month: 'Dec', sales: 5100, purchases: 4200 },
  ];

  const displayedData = showNextSix ? nextSixMonths : firstSixMonths;

  // Donut chart data
  const revenueData = [
    { name: 'Products', value: 400 },
    { name: 'Services', value: 300 },
    { name: 'Subscriptions', value: 300 },
    { name: 'Others', value: 200 },
  ];
  const COLORS = ['#ef4444', '#a855f7', '#3b82f6', '#f59e0b'];

  // Line chart data for Payments
  const paymentsData = [
    { month: 'Jan', sent: 5000, received: 7000 },
    { month: 'Feb', sent: 4000, received: 6500 },
    { month: 'Mar', sent: 3500, received: 6000 },
    { month: 'Apr', sent: 4800, received: 7200 },
    { month: 'May', sent: 4200, received: 8000 },
    { month: 'Jun', sent: 4600, received: 8500 },
    { month: 'Jul', sent: 5000, received: 9000 },
    { month: 'Aug', sent: 5200, received: 9500 },
    { month: 'Sep', sent: 5300, received: 9700 },
    { month: 'Oct', sent: 5500, received: 10000 },
    { month: 'Nov', sent: 5800, received: 10200 },
    { month: 'Dec', sent: 6000, received: 10500 },
  ];

  return (
    <div className="dashboard-container">
      {/* Widgets */}
      <div className='widgets-container'>
        {widgetData.map((widget, index) => (
          <div key={index} className='widget'>
            <div className='widget-header'>
              <h3>{widget.title}</h3>
              <span className='widget-icon'>{widget.icon}</span>
            </div>
            <div className='widget-value'>{widget.value}</div>
            <div className={`widget-change ${widget.trend === 'up' ? 'positive' : 'negative'}`}>
              {widget.trend === 'up' ? <TrendingUp className="trend-icon" /> : <TrendingDown className="trend-icon" />}
              {widget.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className='chart-container'>
        <div className='primary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Sales and Purchases</h3>
              <select
                className="chart-select"
                value={showNextSix ? "next" : "first"}
                onChange={(e) => setShowNextSix(e.target.value === "next")}
              >
                <option value="first">First 6 Months</option>
                <option value="next">Last 6 Months</option>
              </select>
            </div>
            <div className='sales-purchases-chart'>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayedData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#ef4444" name="Sales" radius={[6, 6, 0, 0]} barSize={25}/>
                  <Bar dataKey="purchases" fill="#a855f7" name="Purchases" radius={[6, 6, 0, 0]} barSize={25}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className='secondary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Revenue Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className='chart-container'>
        <div className='primary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Payments Sent vs Received</h3>
            </div>
            <div className='sales-purchases-chart'>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentsData}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" name="Payments Sent" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="received" name="Payments Received" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className='secondary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Activity Overview</h3>
            </div>
            <div className='chart-placeholder'>
              <Activity className="chart-icon" />
              <p>Activity Chart Visualization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Widgets or Data */}
      <div className='widgets-container'>
        <div className='widget'>
          <div className='widget-header'>
            <h3>Inventory Overview</h3>
            <Package className="w-6 h-6 text-indigo-500" />
          </div>
          <p>Track your product inventory levels and optimize stock management.</p>
        </div>
        <div className='widget'>
          <div className='widget-header'>
            <h3>Customer Activity</h3>
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <p>Monitor customer engagement and retention metrics.</p>
        </div>
        <div className='widget'>
          <div className='widget-header'>
            <h3>Notifications</h3>
            <Bell className="w-6 h-6 text-blue-500" />
          </div>
          <p>Stay on top of alerts and reminders related to business operations.</p>
        </div>
      </div>
    </div>
  );
}
