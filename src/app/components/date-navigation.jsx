import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';


const getDateOffset = (baseDate, offset) => {
  const d = new Date(baseDate);     
  d.setDate(d.getDate() + offset);
  return { year : d.getFullYear(),month: d.getMonth(), day: d.getDate(), dayofWeek: d.getDay() };
};

function updateDatesState(setDatesState, centerDate) {
  const winW = window.innerWidth;
  let copyW = winW;
  let count = 0;

  while (copyW > 370&& count<10) {
    count++;
    copyW -= 95;
  }

  const centerIndex = Math.floor(count / 2);

  const arr = Array.from({ length: count }, (_, i) =>
    getDateOffset(centerDate, i - centerIndex)
  );

  setDatesState(arr);
}

function handleGoRight(setDatesState,date){
  
  const d = new Date(date.year,date.month,date.day+1);
  updateDatesState(setDatesState,d);
}
function handleGoLeft(setDatesState,date){
 

  const d = new Date(date.year,date.month,date.day-1);
  updateDatesState(setDatesState,d);
}

export function DateNavigation({ selectedDate, onSelectDate }) {
  
  const TodayDate= new Date();
  const currentYear = TodayDate.getFullYear();
  const [DatesState,setDatesState]= useState([]);
  // const [newSelectedDate,setNewSelectedDate]= useState(Math.floor(DatesState.length/2));
  
  const [SelectedIndex,setSelectedIndex]=useState(0);
  const [centerDay,setCenterDay]= useState(SelectedIndex);
  console.log("center day : ",centerDay)
  useEffect(()=>{

    
    updateDatesState(setDatesState,TodayDate);
 

  },[SelectedIndex])

const hasInitialized = useRef(false);

useEffect(() => {
  if (DatesState.length === 0) return;
  if (hasInitialized.current) return;

  const center = DatesState.length>1?Math.floor(DatesState.length / 2):0;
  console.log("changing center : ", center )
  setSelectedIndex(c=>center);
  setCenterDay(center);

  hasInitialized.current = true;
}, [DatesState]);

useEffect(() => {
  const handleResize = () => {
    const d= DatesState[SelectedIndex]
    const updateDate= new Date(d.year,d.month,d.day)
    console.log(updateDate);
    updateDatesState(setDatesState, updateDate);


  };

  window.addEventListener("resize", handleResize);

  

  return () => {window.removeEventListener("resize", handleResize)}
}, []);






  const formatDate = (date,isSelected) => {

    const ddate = new Date(1, date.month,date.day );
    const month = ddate.toLocaleString("en-US", { month: "short" });
    const label= ddate.toLocaleString("en-US", { weekday: "short" });
    return (<>
              <div className="text-sm font-medium">{label}</div>
              <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                
                <p>{month}</p>
                <p>{date.day}</p>
              </div>
    </>);
  };

  

  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() =>{handleGoLeft(setDatesState,DatesState[centerDay])
          SelectedIndex>0?setSelectedIndex(s=>s-=1):null
        }}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2 flex-1">
        {DatesState.map((  date,index ) => {
        if(!date){return null}  
        const isSelected = SelectedIndex === index  ;
        // console.log(newSelectedDate, " : ",SelectedIndex);
        const isToday = TodayDate.getDate() === date.day && TodayDate.getMonth()=== date.month ;

          return (
            <button
              key={index}
              id={index}
              onClick={() => {setSelectedIndex(index) }}
              className={`flex-1 px-4 py-3 rounded-2 border transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm '
                  : 'border-border hover:bg-secondary'
              }`}
            >
              {formatDate(date,isSelected)}
              {isToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {handleGoRight(setDatesState,DatesState[centerDay])
          SelectedIndex<DatesState.length-1?setSelectedIndex(s=>s+=1):null
        }}
        className="p-2 hover:bg-secondary rounded-circle transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
