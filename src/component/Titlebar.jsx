import React from "react";
import "./Titlebar.css";

// Material UI icons
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme, useMediaQuery } from "@mui/material";

export default function Titlebar({ activeMenu, toggleSidebar, sidebarWidth }) {
  // Access the current theme context for consistent styling
  const theme = useTheme();
  // Check if the screen size is mobile (breakpoint 'md' or below)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Object mapping menu keys to their display titles
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
    reports: "Reports",
  };

  return (
    // Main titlebar container with dynamic positioning
    // On mobile: left aligned, on desktop: offset by sidebar width
    <div
      className="top-title-bar"
      style={{ left: isMobile ? 0 : `${sidebarWidth}px` }}
    >
      {/* Left section containing page title */}
      <div className="left-section">
        {/* Display the current page title based on activeMenu prop */}
        <h1 className="page-title">{menuTitles[activeMenu]}</h1>
      </div>

      {/* Right section containing user-related icons and info */}
      <div className="user-menu">
        {/* Notifications icon with badge indicator */}
        <div className="icon-wrapper">
          <NotificationsIcon fontSize="medium" />
          <span className="badge">3</span> {/* Notification count badge */}
        </div>

        {/* Settings icon */}
        <div className="icon-wrapper">
          <SettingsIcon fontSize="medium" />
        </div>

        {/* User profile section with icon and name */}
        <div className="user-profile">
          <AccountCircleIcon fontSize="large" /> {/* User avatar icon */}
          <span className="username">John Doe</span> {/* Display username */}
        </div>
      </div>
    </div>
  );
}