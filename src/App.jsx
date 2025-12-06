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

import "./App.css";

const AUTH_STORAGE_KEY = "lost-found-auth";

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
      return parsed;
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
    const payload = { ...data, expiresAt };
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
      return (
        <Register onSwitchToLogin={() => setAuthView("login")} />
      );
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView("register")}
        onAuthenticated={handleAuthenticated}
      />
    );
  }, [authView]);

  // Function to render page based on activeMenu
  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "items":
        return <Items />;
      case "lostReports":
        return <LostReports />;
      case "foundReports":
        return <FoundReports />;
      case "claims":
        return <Claims />;
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
          />

          <Titlebar
            activeMenu={activeMenu}
            toggleSidebar={toggleSidebar}
            sidebarWidth={sidebarWidth}
            onLogout={handleLogout}
          />

          <main className="app-content">{renderPage()}</main>
        </div>
      )}
    </>
  );
}
