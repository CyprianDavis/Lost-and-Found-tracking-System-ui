import React from "react";
import './Titlebar.css';

// Material UI imports
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function Titlebar({ activeMenu }) {
  const menuTitles = {
    dashboard: "Dashboard",
    suppliers: "Suppliers",
    inventory: "Inventory",
    products: "Products",
    sales: "Sales",
    customers: "Customers",
    orders: "Orders",
    payments: "Payments",
    discounts: "Discounts",
    reports: "Reports"
  };

  return (
    <div className="top-title-bar">
      <div className="left-section">
        <button className="menu-toggle">
          {/* You can also add a MUI menu icon here if needed */}
        </button>
        <h1 className="page-title">{menuTitles[activeMenu]}</h1>
      </div>

      <div className="user-menu">
        {/* Notifications */}
        <div className="icon-wrapper">
          <NotificationsIcon fontSize="medium" />
          <span className="badge">3</span>
        </div>

        {/* Settings */}
        <div className="icon-wrapper">
          <SettingsIcon fontSize="medium" />
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <AccountCircleIcon fontSize="large" />
          <span>John Doe</span>
        </div>
      </div>
    </div>
  );
}
