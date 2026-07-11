"use client";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

export default function Header() {
  const greeting = getGreeting();

  return (
    <header className="sticky top-0 z-40 bg-[#f5f5f7]/90 backdrop-blur-md">
      <div className="max-w-[500px] mx-auto px-5 pt-4 pb-3">
        <p className="text-sm text-[#6e6e73]">{greeting}</p>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
          Stefany
        </h1>
      </div>
    </header>
  );
}
