import { CheckCircle } from "lucide-react";

export default function DailyStreak({ userStreak_current = 0 }) {
  return (
    <div
    className="flex items-center h-[56px] px-2  
        border-b-2 border-[var(--primary)]
  
      "
      style={{ backgroundColor: "var(--streak-bg)" }}
    >

      <p className="text-foreground m-1 font-bold   text-lg ">
        {userStreak_current}
      </p>
      <CheckCircle
        className="m-1"
        size={22}
        style={{ color: "var(--primary)" }}
      />
    </div>
  );
}
