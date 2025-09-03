import React, { useState } from "react";
import Sidebar from "./component/Sidebar";
import Titlebar from "./component/Titlebar";

// Pages
import Dashboard from "./component/pages/Dashboard";
import Suppliers from "./component/pages/Suppliers";
import Inventory from "./component/pages/Inventory";
import Products from "./component/pages/Products";
import Sales from "./component/pages/Sales";
import Customers from "./component/pages/Customers";
import Orders from "./component/pages/Orders";
import Payments from "./component/pages/Payments";
import Discounts from "./component/pages/Discount";
import Reports from "./component/pages/Reports";

import "./App.css";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(200);

  // Mobile toggle handler
  const toggleSidebar = () => {
    setSidebarWidth((prev) => (prev === 0 ? 200 : 0));
  };

  // Function to render page based on activeMenu
  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "suppliers":
        return <Suppliers />;
      case "inventory":
        return <Inventory />;
      case "products":
        return <Products />;
      case "sales":
        return <Sales />;
      case "customers":
        return <Customers />;
      case "orders":
        return <Orders />;
      case "payments":
        return <Payments />;
      case "discounts":
        return <Discounts />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onSidebarWidth={setSidebarWidth}
      />

      {/* Titlebar */}
      <Titlebar
        activeMenu={activeMenu}
        toggleSidebar={toggleSidebar}
        sidebarWidth={sidebarWidth}
      />

      {/* Main Content Area */}
      <main
        className="app-content"
        style={{ marginLeft: "0px", marginTop: "64px" }}
      >
        {renderPage()}
      </main>
    </div>
  );
}
