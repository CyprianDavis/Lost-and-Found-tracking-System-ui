import React, { useState, useEffect } from "react";
import "./Sidebar.css";
// Import Material-UI components for building the sidebar
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Toolbar,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
// Import icons for menu items and toggle buttons
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentsIcon from "@mui/icons-material/Payments";
import DiscountIcon from "@mui/icons-material/LocalOffer";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StoreIcon from "@mui/icons-material/Store";
import CategoryIcon from "@mui/icons-material/Category";

// Define width constants for different sidebar states
const drawerWidth = 200;        // Width when sidebar is fully expanded
const collapsedDrawerWidth = 60; // Width when sidebar is collapsed (icons only)

// Main Sidebar component function
export default function Sidebar({ activeMenu, setActiveMenu, onSidebarWidth }) {
  // Get the current theme for responsive design
  const theme = useTheme();
  // Check if the current screen size is mobile (below 'md' breakpoint)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // State to manage whether sidebar is open or closed
  // Default to open on desktop, closed on mobile
  const [open, setOpen] = useState(!isMobile);

  // Effect to automatically handle sidebar state on screen size changes
  useEffect(() => {
    // Open sidebar on desktop, close on mobile when screen size changes
    setOpen(!isMobile);
  }, [isMobile]); // Re-run when isMobile value changes

  // Effect to notify parent component about sidebar width changes
  useEffect(() => {
    // Calculate current width based on device and open state
    const width = isMobile
      ? drawerWidth  // On mobile, always use full width when open
      : open
      ? drawerWidth  // On desktop, use full width when open
      : collapsedDrawerWidth; // On desktop, use collapsed width when closed
    
    // Call parent callback if provided to communicate width change
    if (onSidebarWidth) onSidebarWidth(width);
  }, [isMobile, open, onSidebarWidth]); // Re-run when any of these dependencies change

  // Function to toggle sidebar open/closed state
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Array defining all navigation menu items with their properties
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "suppliers", label: "Suppliers", icon: <StoreIcon /> },
    { id: "products", label: "Products", icon: <CategoryIcon /> },
    { id: "sales", label: "Sales", icon: <ShoppingCartIcon /> },
    { id: "inventory", label: "Inventory", icon: <InventoryIcon /> },
    { id: "customers", label: "Customers", icon: <PeopleIcon /> },
    { id: "orders", label: "Orders", icon: <ShoppingCartIcon /> },
    { id: "payments", label: "Payments", icon: <PaymentsIcon /> },
    { id: "discounts", label: "Discounts", icon: <DiscountIcon /> },
    { id: "reports", label: "Reports", icon: <AssessmentIcon /> },
  ];

  return (
    <>
      {/* Mobile hamburger menu button - only visible on mobile screens */}
      {isMobile && (
        <IconButton
          aria-label="open drawer"  // Accessibility label
          onClick={toggleDrawer}     // Toggle sidebar on click
          edge="start"               // Align to start of container
          className="sidebar-hamburger" // CSS class for styling
        >
          <MenuIcon />  {/* Hamburger menu icon */}
        </IconButton>
      )}

      {/* Main drawer component that contains the sidebar navigation */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"} // Temporary on mobile (overlay), permanent on desktop
        open={open}           // Controlled open/close state
        onClose={toggleDrawer} // Close handler (for mobile overlay)
        className={`sidebar-drawer ${open ? "expanded" : "collapsed"}`} // Dynamic CSS classes
        sx={{
          // Responsive width handling
          width: isMobile
            ? drawerWidth  // Full width on mobile when open
            : open
            ? drawerWidth  // Full width on desktop when open
            : collapsedDrawerWidth, // Collapsed width on desktop when closed
          "& .MuiDrawer-paper": {
            // Apply same width logic to the paper (visible part) of the drawer
            width: isMobile
              ? drawerWidth
              : open
              ? drawerWidth
              : collapsedDrawerWidth,
          },
        }}
      >
        {/* Toolbar section at the top of the sidebar */}
        <Toolbar className="sidebar-toolbar">
          {/* Show app title only when sidebar is expanded */}
          {open && (
            <Typography variant="h6" noWrap component="div">
              AISMS  {/* Application name/title */}
            </Typography>
          )}

          {/* Desktop toggle button - only visible on non-mobile screens */}
          {!isMobile && (
            <IconButton onClick={toggleDrawer} className="sidebar-toggle-btn">
              {/* Show different icons based on open state */}
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>

        {/* Scrollable container for menu items */}
        <Box sx={{ overflow: "auto" }}>
          <List>
            {/* Map through menuItems array to create navigation buttons */}
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding className="sidebar-list-item">
                <ListItemButton
                  selected={activeMenu === item.id} // Highlight if this is the active menu
                  onClick={() => {
                    setActiveMenu(item.id); // Set this menu as active
                    if (isMobile) toggleDrawer(); // Auto-close on mobile after selection
                  }}
                  // Dynamic CSS classes based on state
                  className={`sidebar-btn ${
                    activeMenu === item.id ? "active" : ""
                  } ${open ? "expanded" : "collapsed"}`}
                >
                  {/* Menu item icon */}
                  <ListItemIcon className="sidebar-icon">{item.icon}</ListItemIcon>
                  {/* Menu item text - hidden when sidebar is collapsed */}
                  <ListItemText
                    primary={item.label}
                    className={`sidebar-text ${open ? "visible" : "hidden"}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}