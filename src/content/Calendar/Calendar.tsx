import { ISectionData, Term} from '../App/App.types'
import { convertToMatrix } from './utils'
import SectionPopup from '../SectionPopup/SectionPopup'
import './Calendar.css'

interface IProps {
  sections: ISectionData[],
  newSection: ISectionData,
  currentWorklistNumber: number,
  currentTerm: Term,
  selectedSection: ISectionData | null;
  setSections: (data: ISectionData[]) => void,
  setInvalidSection: (state: boolean) => void,
  setSelectedSection: (section: ISectionData | null) => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const times: string[] = [];
for (let hour = 7; hour <= 20; hour++) {
    times.push(`${hour}:00`);
    times.push(`${hour}:30`);
}

const Calendar = ({sections, newSection, currentWorklistNumber, setSections, setInvalidSection, currentTerm, selectedSection, setSelectedSection}:IProps) => {
  // const [selectedSection, setSelectedSection] = useState<ISectionData | null>(null)

  const calendarSections = sections.filter((section) => section.worklistNumber === currentWorklistNumber && (section.term === currentTerm || section.term == Term.winterFull))

  return (
    <div className="calendar">
      {selectedSection && <SectionPopup selectedSection={selectedSection} sections={sections} setSections={setSections} setSelectedSection={setSelectedSection} />}
      <div className="header">
        <div className="time-marker"></div>
        {daysOfWeek.map((day, index) => (
          <div key={index} className="header-cell">{day}</div>
        ))}
      </div>
      <div className="body">
        <div className="time-markers">
          {times.map((time, index) => (
            <div key={index} className={`time-marker ${time.endsWith(':30') ? 'half-hour' : ''}`}>{time.endsWith(':00') ? time : ''}</div>
          ))}
        </div>
        {daysOfWeek.map((day, index) => (
          <div key={index} className="body-column">
            {convertToMatrix(calendarSections, newSection, setInvalidSection, currentTerm)[day]?.map((cell, index) => (
              <div 
                key={index} 
                className="body-cell" 
                style={{backgroundColor: cell.color}}
                onClick={() => {setSelectedSection(cell.sectionContent)}}
              >
                {cell.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar