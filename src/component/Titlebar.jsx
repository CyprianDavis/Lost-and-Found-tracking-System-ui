import React, { useState, useEffect } from "react";
import "./Titlebar.css";
import { Bell, Settings, User } from "lucide-react";

// Custom hook for media queries
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

export default function Titlebar({ activeMenu, toggleSidebar, sidebarWidth }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Object mapping menu keys to their display titles
  const menuTitles = {
    dashboard: "Dashboard Overview",
    suppliers: "Suppliers",
    inventory: "Inventory",
    products: "Products",
    sales: "Sales",
    customers: "Customers",
    orders: "Orders",
    payments: "Payments",
    discounts: "Discounts",
    reports: "Reports",
  };

  return (
    <div
      className="top-title-bar"
      style={{
        left: isMobile ? 0 : `${sidebarWidth}px`,
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Left section containing page title */}
      <div className="left-section">
        <h1 className="page-title">{menuTitles[activeMenu]}</h1>
      </div>

      {/* Right section with icons */}
      <div className="user-menu">
        <div className="icon-wrapper">
          <Bell size={20} />
          <span className="badge">3</span>
        </div>

        <div className="icon-wrapper">
          <Settings size={20} />
        </div>

        <div className="user-profile">
          <User size={24} />
          <span className="username">Cyprian Davis</span>
        </div>
      </div>
    </div>
  );
}
