import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "../App";
import { SeoBuildContext } from "../components/Seo/buildContext";
export { publicRoutes } from "./routes";

export function render(path) {
  let seo;
  const collect = (value) => {
    if (seo) throw new Error(`Multiple SEO owners for ${path}`);
    seo = value;
  };
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <SeoBuildContext.Provider value={collect}><App /></SeoBuildContext.Provider>
      </StaticRouter>
    </StrictMode>,
  );
  if (!seo) throw new Error(`Missing metadata for ${path}`);
  return { html, seo };
}
