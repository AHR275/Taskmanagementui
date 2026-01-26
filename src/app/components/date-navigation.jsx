import { ChevronLeft, ChevronRight } from 'lucide-react';



export function DateNavigation({ selectedDate, onSelectDate }) {
  const today = new Date().toISOString().split('T')[0];
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  // Calculate dates
  const getDateOffset = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  const yesterday = getDateOffset(-1);
  const tomorrow = getDateOffset(1);
  const dayAfterTomorrow = getDateOffset(2);

  const dates = [
    { label: 'Yesterday', date: yesterday },
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: tomorrow },
    { label: 'Day After Tomorrow', date: dayAfterTomorrow },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const navigateDate = (offset) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + offset);
    onSelectDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => navigateDate(-1)}
        className="p-2 hover:bg-secondary rounded-lg transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2 flex-1">
        {dates.map(({ label, date }) => {
          const isSelected = date === selectedDate;
          const isToday = date === today;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border hover:bg-secondary'
              }`}
            >
              <div className="text-sm font-medium">{label}</div>
              <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                {formatDate(date)}
              </div>
              {isToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigateDate(1)}
        className="p-2 hover:bg-secondary rounded-lg transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
