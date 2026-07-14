// =========================================================
// MAIN / ТОЧКА ВХОДА REACT-ПРИЛОЖЕНИЯ
// Здесь React подключается к HTML и оборачивается в BrowserRouter,
// чтобы работали страницы и маршруты сайта.
// =========================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/onest/wght.css";
import "@fontsource-variable/golos-text/wght.css";

import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);