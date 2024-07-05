import { useEffect, useState } from "react"
import "./App.css"
import CalendarContainer from "../CalendarContainer/CalendarContainer"
import { ISectionData, Term, Views } from "./App.types"
import Form from "../Form/Form"
import TopBar from "../TopBar/TopBar"
import Settings from "../Settings/Settings"
import {
  assignColors,
  ColorTheme,
  getNewSectionColor,
} from "../Settings/Theme/courseColors"
import { ModalLayer } from "../ModalLayer"
import { versionOneFiveZeroUpdateNotification } from "../utils"
import { readSectionData, writeSectionData } from "../../storage/sectionStorage"

function App() {
  const [newSection, setNewSection] = useState<ISectionData | null>(null)
  const [sections, setSections] = useState<ISectionData[]>([])
  const [sectionConflict, setSectionConflict] = useState<boolean>(false)
  const [currentWorklistNumber, setCurrentWorklistNumber] = useState<number>(0)
  const [currentTerm, setCurrentTerm] = useState<Term>(Term.One)
  const [currentView, setCurrentView] = useState<Views>(Views.calendar)
  const [colorTheme, setColorTheme] = useState<ColorTheme>(ColorTheme.Green)

  // Sync initial state with chrome storage on mount
  useEffect(() => {
    const syncInitialState = () => {
      chrome.storage.sync.get("sections", (result) => {
        if (result.sections !== undefined) {
          handleSectionImport(assignColors(result.sections, ColorTheme.Green))
          chrome.storage.sync.remove("sections", function () {
            console.log("Sections reset to empty.")
          })
        }
      })

      // we used to persist this, but no longer need to
      chrome.storage.local.remove("currentTerm")

      chrome.storage.local.get(
        ["colorTheme", "sections", "currentWorklistNumber"],
        (result) => {
          if (result.colorTheme !== undefined) {
            setColorTheme(result.colorTheme)
          }
          if (result.currentWorklistNumber !== undefined) {
            setCurrentWorklistNumber(result.currentWorklistNumber)
          }
        }
      )
    }

    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      if (changes.newSection) {
        const newVal: ISectionData = changes.newSection.newValue
        if (newVal === null) return
        setNewSection(newVal)
        if (newVal.terms.size <= 1) {
          //Don't set the term to WF, just keep the term to what is selected
          setCurrentTerm(newVal.terms.values().next().value)
        }
      }
    }

    syncInitialState()
    chrome.storage.onChanged.addListener(handleStorageChange)
    versionOneFiveZeroUpdateNotification()
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, []) // Run only once on mount

  // Update chrome storage whenever relevant state changes
  useEffect(() => {
    chrome.storage.local.set({ currentWorklistNumber })
  }, [currentWorklistNumber])

  useEffect(() => {
    chrome.storage.local.set({ colorTheme })
  }, [colorTheme])

  useEffect(() => {
    // Check if there is a real change to trigger the update
    // if (prevColorTheme.current !== colorTheme || JSON.stringify(prevSections.current) !== JSON.stringify(sections)) {
    const newSections = assignColors(sections, colorTheme)

    if (JSON.stringify(newSections) !== JSON.stringify(sections)) {
      setSections(newSections)
    }

    // Update refs
    // prevColorTheme.current = colorTheme;
    // prevSections.current = sections;
    // }
  }, [colorTheme, sections]) // React only if these values change

  const handleAddNewSection = () => {
    const updatedNewSection = newSection!
    updatedNewSection.worklistNumber = currentWorklistNumber
    updatedNewSection.color = getNewSectionColor(
      sections,
      updatedNewSection,
      colorTheme
    )

    const updatedSections = [...sections, updatedNewSection]
    setSections(updatedSections)
    writeSectionData(updatedSections)
    setNewSection(null)
    chrome.storage.local.set({ newSection: null })
  }

  const handleDeleteSection = (sectionToDelete: ISectionData) => {
    const updatedSections = sections.filter((s) => s !== sectionToDelete)
    setSections(updatedSections)
    writeSectionData(updatedSections)
  }

  const handleCancelNewSection = () => {
    setNewSection(null)
    chrome.storage.local.set({ newSection: null })
  }

  const handleClearWorklist = () => {
    const updatedSections = sections.filter(
      (x) => x.worklistNumber !== currentWorklistNumber
    )
    setSections(updatedSections)
    writeSectionData(updatedSections)
  }

  return (
    <ModalLayer
      currentWorklistNumber={currentWorklistNumber}
      handleClearWorklist={handleClearWorklist}
      handleDeleteSection={handleDeleteSection}
    >
      <div className="App">
        <TopBar
          currentView={currentView}
          setCurrentView={setCurrentView}
          sections={sections}
        />
        {currentView === Views.calendar ? (
          <div className="CalendarViewContainer">
            <CalendarContainer
              sections={sections}
              newSection={newSection}
              setSectionConflict={setSectionConflict}
              currentWorklistNumber={currentWorklistNumber}
              setCurrentWorklistNumber={setCurrentWorklistNumber}
              currentTerm={currentTerm}
              setCurrentTerm={setCurrentTerm}
            />

            <Form
              newSection={newSection}
              sectionConflict={sectionConflict}
              handleAddNewSection={handleAddNewSection}
              handleCancel={handleCancelNewSection}
            />
          </div>
        ) : (
          <Settings
            colorTheme={colorTheme}
            sections={sections}
            setColorTheme={setColorTheme}
            setSections={setSections}
          />
        )}
      </div>
    </ModalLayer>
  )
}

export default App
