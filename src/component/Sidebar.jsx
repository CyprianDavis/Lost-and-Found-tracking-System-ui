import React from "react";
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
} from "@mui/material";

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

export default function Sidebar({ activeMenu, setActiveMenu }) {
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
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#081730",
          color: "#fff",
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AISMS
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: "auto" }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={activeMenu === item.id}
                onClick={() => setActiveMenu(item.id)}
                sx={{
                  color: "#fff", // text color
                  "& .MuiListItemIcon-root": {
                    color: "#fff", // icon color
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#3a56a7",
                    color: "#fff",
                    "& .MuiListItemIcon-root": {
                      color: "#fff",
                    },
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "#324a90",
                  },
                  "&:hover": {
                    backgroundColor: "#3a56a7",
                    color: "#fff",
                    "& .MuiListItemIcon-root": {
                      color: "#fff",
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
