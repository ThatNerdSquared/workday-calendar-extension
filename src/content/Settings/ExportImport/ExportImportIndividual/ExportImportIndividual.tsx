import { ISectionData, Term } from "../../../App/App.types"
import "../ExportImport.css"
import { useState, useContext } from "react"
import ExportCalendarPopup from "../ExportImportPopups/ExportCalendarPopup"
import ImportCalendarPopup from "../ExportImportPopups/ImportCalendarPopup"
import { ModalDispatchContext, ModalPreset } from "../../../ModalLayer"
import ProgressBar from "../../../ProgressBar/ProgressBar"

interface IProps {
  sections: ISectionData[]
  setSections: (data: ISectionData[]) => void
  handleSectionImport: (data: ISectionData[]) => void
}

export const serializeSetReplacer = (key: unknown, value: unknown) => {
  if (value instanceof Set) {
    return ["_isSet", ...value]
  }
  return value
}

const mapLegacyTermEnumToTermsSet = (oldTerm: number): Set<Term> => {
  switch (oldTerm) {
    case 3:
      return new Set([Term.One])
    case 4:
      return new Set([Term.Two])
    case 5:
      return new Set([Term.One, Term.Two])
    default:
      throw `Old term enum number ${oldTerm} not handled!`
  }
}

// sorry in advance to whoever needs to refactor this (probably me)
const handleImportingTerm = (section: ISectionData): Set<Term> => {
  // @ts-expect-error handle old term enum format
  if (section.term !== undefined) {
    // @ts-expect-error handle old term enum format
    return mapLegacyTermEnumToTermsSet(section.term)
  }
  if (!(section.terms instanceof Set)) {
    // @ts-expect-error handle serialized set as array with "_isSet" first element
    return new Set(section.terms.slice(1) as Term[])
  }
  return section.terms
}

// note that the argument type here is not accurate - more accurate
// "partial" interfaces will probably be implemented with a new data layer
export const rebuildImportedSections = (
  sections: ISectionData[],
  worklistNumber?: number
) => {
  return sections.map((section) => {
    return {
      code: section.code,
      color: section.color,
      name: section.name,
      sectionDetails: section.sectionDetails,
      worklistNumber: worklistNumber ?? section.worklistNumber,
      terms: handleImportingTerm(section),
      session: section.session ?? "2024W",
      instructors: section.instructors,
      courseID: section.courseID,
    }
  })
}

const ExportImportIndividual = ({ sections, handleSectionImport }: IProps) => {
  const [showExportPopup, setShowExportPopup] = useState(false)
  const [showImportPopup, setShowImportPopup] = useState(false)
  const dispatchModal = useContext(ModalDispatchContext)

  const handleExport = (sections: ISectionData[], worklistNumber: number) => {
    sections = sections.filter(
      (section) => section.worklistNumber === worklistNumber
    )
    if (sections.length !== 0) {
      const json = JSON.stringify(sections, serializeSetReplacer, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "schedule.json"
      link.click()
      URL.revokeObjectURL(url)
    } else {
      alert("Please Select A Worklist That Is Not Empty!")
    }
  }

  const handleImport = (
    event: React.ChangeEvent<HTMLInputElement>,
    worklistNumber: number
  ) => {
    const loadingMesage = <ProgressBar message={"Loading Progress: "} />
    dispatchModal({
      preset: ModalPreset.ImportStatus,
      additionalData: loadingMesage,
    })
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let data: ISectionData[] = JSON.parse(e.target?.result as string)
        let newSections = [...sections]
        newSections = newSections.filter(
          (section) => section.worklistNumber !== worklistNumber
        )
        data = rebuildImportedSections(data, worklistNumber)
        newSections = newSections.concat(data)
        handleSectionImport(newSections)
      } catch (error) {
        console.error("Failed to parse JSON file", error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      {showExportPopup && (
        <ExportCalendarPopup
          onCancel={() => setShowExportPopup(false)}
          sections={sections}
          exportFunction={handleExport}
        />
      )}
      {showImportPopup && (
        <ImportCalendarPopup
          onCancel={() => setShowImportPopup(false)}
          sections={sections}
          handleImport={handleImport}
        />
      )}
      <div className="ExportImportRow">
        <div
          className="ExportImportButton"
          onClick={() => setShowExportPopup(true)}
        >
          Export Worklist
        </div>
        <div
          className="ExportImportButton"
          onClick={() => setShowImportPopup(true)}
        >
          Import Worklist
        </div>
      </div>
    </div>
  )
}

export default ExportImportIndividual
