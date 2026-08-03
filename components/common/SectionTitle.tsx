interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="sc-local-section-title">
      <h2>{title}</h2>
      {action}
    </div>
  );
}
