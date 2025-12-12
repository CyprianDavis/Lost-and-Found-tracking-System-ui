import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./component/Sidebar";
import Titlebar from "./component/Titlebar";

import Dashboard from "./component/pages/Dashboard";
import Items from "./component/pages/Items";
import LostReports from "./component/pages/LostReports";
import FoundReports from "./component/pages/FoundReports";
import Claims from "./component/pages/Claims";
import Users from "./component/pages/Users";
import Login from "./component/pages/Login";
import Register from "./component/pages/Register";
import {
  clearAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from "./lib/api";
import { decodeJwtPayload } from "./lib/auth";

import "./App.css";

const AUTH_STORAGE_KEY = "lost-found-auth";

const PERMISSIONS = {
  REPORT_LOST_ITEM: "REPORT_LOST_ITEM",
  REPORT_FOUND_ITEM: "REPORT_FOUND_ITEM",
  CLAIM_ITEM: "CLAIM_ITEM",
  VERIFY_CLAIM: "VERIFY_CLAIM",
  MANAGE_USERS: "MANAGE_USERS",
};

const MENU_RULES = [
  { id: "dashboard", permissions: [] },
  {
    id: "items",
    // Item catalog should only be visible to admins (MANAGE_USERS)
    permissions: [PERMISSIONS.MANAGE_USERS],
  },
  { id: "lostReports", permissions: [PERMISSIONS.REPORT_LOST_ITEM] },
  { id: "foundReports", permissions: [PERMISSIONS.REPORT_FOUND_ITEM] },
  {
    id: "claims",
    permissions: [PERMISSIONS.CLAIM_ITEM, PERMISSIONS.VERIFY_CLAIM],
  },
  { id: "users", permissions: [PERMISSIONS.MANAGE_USERS] },
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed?.expiresAt && parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      const claims = decodeJwtPayload(parsed?.accessToken);
      return { ...parsed, claims };
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState("login");

  const toggleSidebar = () => {
    setSidebarWidth((prev) => (prev === 0 ? 200 : 0));
  };

  const handleAuthenticated = useCallback((data) => {
    if (!data?.accessToken) return;
    const expiresAt =
      data?.expiresIn && !Number.isNaN(Number(data.expiresIn))
        ? Date.now() + Number(data.expiresIn)
        : null;
    const claims = decodeJwtPayload(data.accessToken);
    const payload = { ...data, expiresAt, claims };
    setAuth(payload);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setAuthToken(data.accessToken);
  }, []);

  const handleLogout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthView("login");
    clearAuthToken();
  }, []);

  useEffect(() => {
    if (auth?.accessToken) {
      setAuthToken(auth.accessToken);
    } else {
      clearAuthToken();
    }
  }, [auth]);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    if (!auth?.expiresAt) return;
    if (auth.expiresAt <= Date.now()) {
      handleLogout();
      return;
    }
    const remaining = auth.expiresAt - Date.now();
    const timer = setTimeout(handleLogout, remaining);
    return () => clearTimeout(timer);
  }, [auth, handleLogout]);

  const authContent = useMemo(() => {
    if (authView === "register") {
      return <Register onSwitchToLogin={() => setAuthView("login")} />;
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView("register")}
        onAuthenticated={handleAuthenticated}
      />
    );
  }, [authView, handleAuthenticated]);

  const grantedPermissions = useMemo(() => {
    if (!auth) return [];
    return (auth?.claims?.permissions || [])
      .filter(Boolean)
      .map((permission) => permission.trim().toUpperCase());
  }, [auth]);

  const allowedMenus = useMemo(() => {
    if (!auth) return [];
    const allowed = MENU_RULES.filter(({ permissions: requiredPermissions }) => {
      if (requiredPermissions.length === 0) return true;
      return requiredPermissions.some((permission) =>
        grantedPermissions.includes(permission.toUpperCase()),
      );
    }).map((menu) => menu.id);
    return allowed.length > 0 ? allowed : ["dashboard"];
  }, [auth, grantedPermissions]);

  useEffect(() => {
    if (!auth) {
      setActiveMenu("dashboard");
      return;
    }
    if (!allowedMenus.includes(activeMenu)) {
      setActiveMenu(allowedMenus[0] || "dashboard");
    }
  }, [auth, allowedMenus, activeMenu]);

  const rawRole = auth?.claims?.role || auth?.user?.role || "";
  const roleCode = rawRole?.toUpperCase?.() || "";
  const userId = auth?.claims?.uid || auth?.user?.id || null;

  const username = useMemo(() => {
    if (!auth) return "";
    return (
      auth?.claims?.username ||
      auth?.user?.username ||
      auth?.user?.fullName ||
      "User"
    );
  }, [auth]);

  const roleLabel = useMemo(() => {
    if (!roleCode) return "";
    return roleCode
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [roleCode]);

  // Function to render page based on activeMenu
  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard role={roleCode} />;
      case "items":
        return <Items />;
      case "lostReports":
        return (
          <LostReports
            currentUserId={userId}
            permissions={grantedPermissions}
          />
        );
      case "foundReports":
        return (
          <FoundReports
            currentUserId={userId}
            permissions={grantedPermissions}
          />
        );
      case "claims":
        return (
          <Claims
            currentUserId={userId}
            permissions={grantedPermissions}
          />
        );
      case "users":
        return <Users />;
      case "login":
        return <Login />;
      case "register":
        return <Register />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {!auth ? (
        <div className="auth-wrapper">{authContent}</div>
      ) : (
        <div className="app-container">
          <Sidebar
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onSidebarWidth={setSidebarWidth}
            visibleMenus={allowedMenus}
          />

          <Titlebar
            activeMenu={activeMenu}
            toggleSidebar={toggleSidebar}
            sidebarWidth={sidebarWidth}
            onLogout={handleLogout}
            username={username}
            role={roleLabel}
            currentUserId={userId}
            roleCode={roleCode}
          />

          <main className="app-content">{renderPage()}</main>
        </div>
      )}
    </>
  );
}
