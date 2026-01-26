import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';


const getDateOffset = (date,offset) => {
    // const date = new Date();
    date.setDate(date.getDate() + offset);
    const retDate = {month:date.getMonth(), day : date.getDate() }
    return retDate;
};


export function DateNavigation({ selectedDate, onSelectDate }) {
  
  const TodayDate= new Date();
  const currentYear = TodayDate.getFullYear();
  let  selectDate = getDateOffset(TodayDate,0);
  const [today,setToday]=useState({month:( selectDate.month), day:selectDate.day});
  const [midDay,setmidDay]=useState(today);
  selectDate = getDateOffset(TodayDate,-1);
  const [leftDay,setLeftDay]=useState({month:selectDate.month,day:selectDate.day });
  selectDate = getDateOffset(TodayDate,2);
  const [rightDay,setRightDay]=useState({month:selectDate.month,day:selectDate.day });
  const [newSelectedDate,setNewSelectedDate]= useState(midDay);
  console.log("new soele : ",newSelectedDate);
  useEffect(()=>{
    const UpdateDate= new Date(currentYear,midDay.month,midDay.day);
    console.log("update Date : " , UpdateDate)
    selectDate = getDateOffset(UpdateDate,0);
    // setToday({month: selectDate.month, day:selectDate.day})
    selectDate = getDateOffset(UpdateDate,-1);
    setLeftDay({month: selectDate.month, day:selectDate.day})
    selectDate = getDateOffset(UpdateDate,+2);
    setRightDay({month: selectDate.month, day:selectDate.day})

  },[newSelectedDate])
  // const midDay = ;
  // let newSelectedDate = selectedDate; 
  // const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  // Calculate dates

  // let   midDay= 0 ;
  // const leftDay = getDateOffset(-1+midDay);
  // const rightDay = getDateOffset(1+midDay);
  // const dayAfterrightDay = getDateOffset(2);

  const dates = [
    { label: 'Day Before ', date: leftDay },
    { label: 'Selected Day', date: midDay },
    { label: 'Day After ', date: rightDay },
    // { label: 'Day After rightDay', date: dayAfterrightDay },
  ];

  const formatDate = (date) => {

    const ddate = new Date(1, date.month );
    const month = ddate.toLocaleString("en-US", { month: "short" });
    return (<>
    <p>{month}</p>
    <p>{date.day}</p>
    </>);
  };

  // const navigateDate = (offset) => {
  //   const currentDate = new Date(selectedDate + 'T00:00:00');
  //   currentDate.setDate(currentDate.getDate() + offset);
  //   onSelectDate(currentDate.toISOString().split('T')[0]);
  // };

  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() =>{ setmidDay(leftDay); setNewSelectedDate(leftDay)}}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2 flex-1">
        {dates.map(({ label, date,index }) => {
        const isSelected = date.month === newSelectedDate.month &&date.day === newSelectedDate.day ;
          const isToday = date === today ;

          return (
            <button
              key={`${index}-${date}`}
              onClick={() => {setNewSelectedDate(date) }}
              className={`flex-1 px-4 py-3 rounded-2 border transition-all ${
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
        onClick={() => {setmidDay(rightDay); setNewSelectedDate(rightDay)}}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
