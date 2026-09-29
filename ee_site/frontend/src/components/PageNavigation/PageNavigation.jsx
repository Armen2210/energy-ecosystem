import { Link } from "react-router-dom";

import "./PageNavigation.css";

export default function PageNavigation({
  backLabel,
  backTo,
  backState,
  breadcrumbItems = [],
}) {
  return (
    <div className="page-navigation">
      <Link
        className="page-navigation__back"
        to={backTo}
        state={backState}
      >
        ← {backLabel}
      </Link>

      <nav
          className={`page-navigation__breadcrumb ${
            breadcrumbItems.length >= 3
              ? "page-navigation__breadcrumb--deep"
              : ""
          }`}
          aria-label="Хлебные крошки"
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <span
              className="page-navigation__breadcrumb-item"
              key={`${item.label}-${index}`}
            >
              {index > 0 && (
                <span
                  className="page-navigation__separator"
                  aria-hidden="true"
                >
                  /
                </span>
              )}

              {item.to && !isLast ? (
                <Link
                  className="page-navigation__breadcrumb-link"
                  to={item.to}
                  state={item.state}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "page-navigation__current"
                      : "page-navigation__breadcrumb-label"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}