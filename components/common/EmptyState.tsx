import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#e5e5ea] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[#6e6e73]" />
      </div>
      <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">{title}</h3>
      <p className="text-sm text-[#6e6e73] max-w-[200px]">{description}</p>
    </div>
  );
}
