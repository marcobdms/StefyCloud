interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6">
      <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{title}</h2>
      {action}
    </div>
  );
}
