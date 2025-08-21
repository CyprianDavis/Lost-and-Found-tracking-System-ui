import React, { useState } from "react";
import Sidebar from "./component/Sidebar";
import Titlebar from "./component/Titlebar";
import "./App.css"; // optional global styles

export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(200);

  // Mobile toggle handler (only needed for Titlebar button)
  const toggleSidebar = () => {
    // Just force-collapse by updating width
    setSidebarWidth((prev) => (prev === 0 ? 200 : 0));
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
        style={{ marginLeft: `${sidebarWidth}px`, marginTop: "64px" }}
      >
        <h2>{activeMenu.toUpperCase()} Content</h2>
        <p>This is where your page content for {activeMenu} will render.</p>
      </main>
    </div>
  );
}
