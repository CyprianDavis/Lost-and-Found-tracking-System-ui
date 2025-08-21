import React, { useState, useEffect } from "react";
import "./Sidebar.css";
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

const drawerWidth = 200;
const collapsedDrawerWidth = 60;

export default function Sidebar({ activeMenu, setActiveMenu, onSidebarWidth }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(!isMobile);

  // Update sidebar open/close on screen size change
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  // Notify parent whenever width changes
  useEffect(() => {
    const width = isMobile
      ? drawerWidth
      : open
      ? drawerWidth
      : collapsedDrawerWidth;
    if (onSidebarWidth) onSidebarWidth(width);
  }, [isMobile, open, onSidebarWidth]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

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
      {/* Mobile hamburger menu button */}
      {isMobile && (
        <IconButton
          aria-label="open drawer"
          onClick={toggleDrawer}
          edge="start"
          className="sidebar-hamburger"
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={toggleDrawer}
        className={`sidebar-drawer ${open ? "expanded" : "collapsed"}`}
        sx={{
          width: isMobile
            ? drawerWidth
            : open
            ? drawerWidth
            : collapsedDrawerWidth,
          "& .MuiDrawer-paper": {
            width: isMobile
              ? drawerWidth
              : open
              ? drawerWidth
              : collapsedDrawerWidth,
          },
        }}
      >
        <Toolbar className="sidebar-toolbar">
          {open && (
            <Typography variant="h6" noWrap component="div">
              AISMS
            </Typography>
          )}

          {!isMobile && (
            <IconButton onClick={toggleDrawer} className="sidebar-toggle-btn">
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>

        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding className="sidebar-list-item">
                <ListItemButton
                  selected={activeMenu === item.id}
                  onClick={() => {
                    setActiveMenu(item.id);
                    if (isMobile) toggleDrawer();
                  }}
                  className={`sidebar-btn ${
                    activeMenu === item.id ? "active" : ""
                  } ${open ? "expanded" : "collapsed"}`}
                >
                  <ListItemIcon className="sidebar-icon">{item.icon}</ListItemIcon>
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
