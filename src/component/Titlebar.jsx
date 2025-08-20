import React from "react";
import './Titlebar.css';

export default function Titlebar({ activeMenu }) {
  const menuTitles = {
    dashboard: "Dashboard",
    suppliers: "Suppliers",
    inventory: "Invenotry",
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
         
        </button>
        <h1 className="page-title">{menuTitles[activeMenu]}</h1>
      </div>

      <div className="user-menu">
        <div className="notification-badge">
          <i className="fas fa-bell"></i>
          <span className="badge">3</span>
        </div>
        <div className="user-profile">
          <div className="user-avatar">JD</div>
          <span>John Doe</span>
        </div>
      </div>
    </div>
  );
}
