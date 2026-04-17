import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__content">
        <h2 className="page-header__title">{title}</h2>
        {description ? (
          <p className="page-header__description">{description}</p>
        ) : null}
      </div>

      {action ? <div className="page-header__action">{action}</div> : null}
    </div>
  );
}
