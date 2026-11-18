export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-(--radius-lg) bg-(--surface) border border-(--border) shadow-(--shadow-soft) hover:shadow-(--shadow-card) transition-shadow ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-5 border-b border-(--border)">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-md bg-(--primary-tint) text-(--color-primary) flex items-center justify-center ring-1 ring-(--primary-border)">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-(--text)">{title}</h2>
          {subtitle && (
            <p className="text-sm text-(--text-muted) mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
