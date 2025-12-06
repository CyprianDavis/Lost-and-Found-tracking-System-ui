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

export default function Titlebar({
  activeMenu,
  toggleSidebar,
  sidebarWidth,
  onLogout,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Object mapping menu keys to their display titles
  return (
    <div
      className="top-title-bar"
      style={{
        left: isMobile ? 0 : `${sidebarWidth}px`,
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        transition: "all 0.3s ease",
      }}
    >
      <div className="left-section">
        <img src="/ku-logo.svg" alt="Kampala University" className="ku-logo" />
        <div className="logo-text">
          <span>Kampala University</span>
          <small>Lost &amp; Found Unit</small>
        </div>
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
          <span className="username">LF Admin</span>
          {onLogout && (
            <button type="button" className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
