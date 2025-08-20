import React, { useState } from "react";
import Sidebar from "./component/Sidebar";
import Titlebar from "./component/Titlebar";

import "./App.css";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <div className="app-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
       <Titlebar activeMenu={activeMenu} />
     
    </div>
  );
}
