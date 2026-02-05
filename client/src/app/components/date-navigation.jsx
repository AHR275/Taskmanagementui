import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function toDateOnlyISO(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function normalizeToJSDate(selectedDate) {
  // selectedDate can be 'YYYY-MM-DD' or Date
  if (!selectedDate) return new Date();

  if (selectedDate instanceof Date) return selectedDate;

  if (typeof selectedDate === "string") {
    // If it's already YYYY-MM-DD, parse as local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return new Date(`${selectedDate}T00:00:00`);
    }
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const d = new Date(selectedDate);
  return isNaN(d.getTime()) ? new Date() : d;
}

const getDateOffset = (baseDate, offset) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    dayofWeek: d.getDay(),
  };
};

function computeCount() {
  let copyW = window.innerWidth;
  let count = 0;
  while (copyW > 70 && count < 10) {
    count++;
    copyW -= 95;
  }
  return Math.max(1, count);
}

function buildDates(centerDate) {
  const count = computeCount();
  const centerIndex = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => getDateOffset(centerDate, i - centerIndex));
}

export function DateNavigation({ selectedDate, onSelectDate }) {
  const today = useMemo(() => new Date(), []);
  const [centerDate, setCenterDate] = useState(() => normalizeToJSDate(selectedDate));
  const [DatesState, setDatesState] = useState([]);
  const [SelectedIndex, setSelectedIndex] = useState(0);

  // ✅ Keep internal centerDate synced with parent selectedDate
  useEffect(() => {
    const next = normalizeToJSDate(selectedDate);
    // avoid unnecessary rerenders
    if (toDateOnlyISO(next) !== toDateOnlyISO(centerDate)) {
      setCenterDate(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Build dates whenever centerDate changes
  useEffect(() => {
    const arr = buildDates(centerDate);
    setDatesState(arr);
    setSelectedIndex(Math.floor(arr.length / 2)); // keep selected centered
  }, [centerDate]);

  // Rebuild on resize, keep same centerDate
  useEffect(() => {
    const handleResize = () => {
      const arr = buildDates(centerDate);
      setDatesState(arr);
      setSelectedIndex(Math.floor(arr.length / 2));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [centerDate]);

  const formatDate = (date, isSelected, isToday) => {
    const ddate = new Date(date.year, date.month, date.day);
    const label = ddate.toLocaleString("en-US", { weekday: "short" });

    return (
      <>
        {isToday && !isSelected && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1" />
        )}
        <div className={`text-xs ${isSelected ? "opacity-90" : "text-muted-foreground"}`}>
          <p style={{ fontSize: "20px", marginBottom: "0px" }}>{date.day}</p>
        </div>
        <p style={{ fontSize: "10px", marginBottom: "1px", marginTop: "4px" }}>{label}</p>
      </>
    );
  };

  const toJSDate = (d) => new Date(d.year, d.month, d.day);

  const moveCenter = (deltaDays) => {
    const next = new Date(centerDate);
    next.setDate(next.getDate() + deltaDays);
    setCenterDate(next);

    // ✅ Tell parent using ISO string
    onSelectDate?.(toDateOnlyISO(next));
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => moveCenter(-1)}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2 flex-1">
        {DatesState.map((date, index) => {
          if (!date) return null;

          const isSelected = SelectedIndex === index;

          // ✅ include year in today check
          const isToday =
            today.getFullYear() === date.year &&
            today.getMonth() === date.month &&
            today.getDate() === date.day;

          return (
            <button
              key={index}
              onClick={() => {
                const clicked = toJSDate(date);
                setCenterDate(clicked);
                onSelectDate?.(toDateOnlyISO(clicked)); // ✅ ISO string
              }}
              className={`flex-1 px-1 py-3 rounded-circle border transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border hover:bg-secondary"
              }`}
              style={{
                maxWidth: "70px",
                minWidth: "70px",
                maxHeight: "70px",
                minHeight: "70px",
                paddingTop: "5px",
              }}
            >
              {formatDate(date, isSelected, isToday)}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => moveCenter(1)}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
