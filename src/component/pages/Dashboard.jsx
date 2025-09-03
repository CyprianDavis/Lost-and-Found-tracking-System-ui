import React, { useState } from 'react';
import './Dashboard.css';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Wallet,
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Users,
  Package,
  Bell,
  Search,
  Settings,
  User
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Financial metrics data for widgets
  const widgetData = [
  {
    title: "Total Sales",
    value: "$86,420",
    change: "+15.2%",
    icon: <BarChart3 className="w-6 h-6 text-green-500" />,
    trend: "up",
  },
  {
    title: "Total Expenses",
    value: "$42,150",
    change: "+8.3%",
    icon: <CreditCard className="w-6 h-6 text-red-500" />,
    trend: "up",
  },
  {
    title: "Payments Sent",
    value: "$28,640",
    change: "-5.1%",
    icon: <ArrowUpCircle className="w-6 h-6 text-yellow-500" />,
    trend: "down",
  },
  {
    title: "Payments Received",
    value: "$78,350",
    change: "+12.7%",
    icon: <ArrowDownCircle className="w-6 h-6 text-blue-500" />,
    trend: "up",
  }
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
             
            </div>
            <div className='sales-purchases-chart'>
              <div className='chart-placeholder'>
                <BarChart3 className="chart-icon" />
                <p>Sales and Purchases Chart Visualization</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className='secondary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Revenue Distribution</h3>
              
            </div>
            <div className='chart-placeholder'>
             
              <p>Revenue Distribution Chart</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Charts */}
      <div className='chart-container'>
        <div className='primary-chart'>
          <div className='chart-card'>
            <div className="chart-header">
              <h3>Customer Growth</h3>
              
            </div>
            <div className='sales-purchases-chart'>
              <div className='chart-placeholder'>
                <Users className="chart-icon" />
                <p>Customer Growth Chart</p>
              </div>
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
      
      {/* Recent Activity */}
      <div className='recent-activity'>
        <div className="activity-header">
          <h3>Recent Activity</h3>
          <Bell className="activity-icon" />
        </div>
        <ul>
          <li>
            <ShoppingCart className="activity-item-icon" />
            <div className="activity-info">
              <p>New order #3245 received</p>
              <span>2 minutes ago</span>
            </div>
          </li>
          <li>
            <DollarSign className="activity-item-icon" />
            <div className="activity-info">
              <p>Payment of $245 processed</p>
              <span>45 minutes ago</span>
            </div>
          </li>
          <li>
            <Users className="activity-item-icon" />
            <div className="activity-info">
              <p>User John Doe signed up</p>
              <span>1 hour ago</span>
            </div>
          </li>
          <li>
            <Package className="activity-item-icon" />
            <div className="activity-info">
              <p>Product "Premium Widget" added to catalog</p>
              <span>3 hours ago</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}