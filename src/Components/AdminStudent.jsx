import React, { useContext, useEffect, useRef, useState } from "react";
import {
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import StudentContext from "../context/StudentContext";

const Tablestudents = () => {
  const { students, updateStudent, deleteStudent, setStudents } = useContext(StudentContext);
  const [editingRow, setEditingRow] = useState(-1);
  const [editingStudentIndex, setEditingStudentIndex] = useState();
  const [editedStudentData, setEditedStudentData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loader, setLoader] = useState(false);
  // New state for tracking which row is expanded (detail view)
  const [expandedRowIndex, setExpandedRowIndex] = useState(-1);
  // State to track how many rows are currently visible
  const [visibleRowCount, setVisibleRowCount] = useState(20);
  const containerRef = useRef();

  const customLabels = [
    "Name",
    "Email Id",
    "Roll No",
    "CGPA",
    "Program",
    "Department",
    "TA Type",
    "Dept Pref 1",
    "Grade Dept Pref 1",
    "Dept Pref 2",
    "Grade Dept Pref 2",
    "Other Pref 1",
    "Grade Other Pref 1",
    "Other Pref 2",
    "Grade Other Pref 2",
    "Other Pref 3",
    "Grade Other Pref 3",
    "Other Pref 4",
    "Grade Other Pref 4",
    "Other Pref 5",
    "Grade Other Pref 5",
    "Non-Prefs 1",
    "Non-Prefs 2",
    "Non-Prefs 3",
  ];
  // Only display the first 7 columns (up to "TA Type") in the summary view
  const summaryHeaders = customLabels.slice(0, 7);

  const studentKeyMapping = {
    "Name": "name",
    "Email Id": "email",
    "Roll No": "rollNo",
    "CGPA": "cgpa",
    "Program": "program",
    "Department": "department",
    "TA Type": "taType",
    "Dept Pref 1": "deptPref1",
    "Grade Dept Pref 1": "gradeDeptPref1",
    "Dept Pref 2": "deptPref2",
    "Grade Dept Pref 2": "gradeDeptPref2",
    "Other Pref 1": "otherPref1",
    "Grade Other Pref 1": "gradeOtherPref1",
    "Other Pref 2": "otherPref2",
    "Grade Other Pref 2": "gradeOtherPref2",
    "Other Pref 3": "otherPref3",
    "Grade Other Pref 3": "gradeOtherPref3",
    "Other Pref 4": "otherPref4",
    "Grade Other Pref 4": "gradeOtherPref4",
    "Other Pref 5": "otherPref5",
    "Grade Other Pref 5": "gradeOtherPref5",
    "Non-Prefs 1": "nonPrefs1",
    "Non-Prefs 2": "nonPrefs2",
    "Non-Prefs 3": "nonPrefs3",
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [sortedStudent, setSortedStudent] = useState([]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (rowIndex, ID) => {
    setEditingRow(rowIndex);
    let count = 0;
    for (const s of students) {
      if (s._id === ID) {
        break;
      }
      count++;
    }
    setEditingStudentIndex(count);
    setEditedStudentData(students[count]);
  };

  const handleSave = async (ID) => {
    setLoader(true);
    const originalStudentData = students[editingStudentIndex];
    const updatedData = {};
    const hasChanges = Object.keys(editedStudentData).some(
      key => editedStudentData[key] !== students[editingStudentIndex][key]
    );

    if (!hasChanges) {
      handleCancel();
      setLoader(false);
      return;
    }

    for (const key in editedStudentData) {
      if (editedStudentData[key] !== originalStudentData[key]) {
        updatedData[key] = editedStudentData[key];
      }
    }

    try {
      const res = await updateStudent(ID, updatedData);
      setLoader(false);
      if (res.status === "Success") {
        Swal.fire("Updated!", "Student has been updated", "success");
        window.location.reload();
      } else {
        Swal.fire("Oops!", res.message, "error");
      }
      handleCancel();
    } catch (error) {
      Swal.fire("Error", "Failed to update student. Please try again.", "error");
      setLoader(false);
    }
  };

  const handleCancel = () => {
    setEditingRow(-1);
    setEditedStudentData({});
  };

  const handleDelete = async (studentId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteStudent(studentId);
        if (res.status === "Success") {
          Swal.fire("Updated!", "Student has been deleted", "success");
        } else {
          Swal.fire("Oops!", res.message, "error");
        }
      }
    });
  };

  const handleInputChange = (e, label) => {
    const value = e.target.value;
    const studentKey = studentKeyMapping[label];
    setEditedStudentData((prevData) => ({
      ...prevData,
      [studentKey]: value,
    }));
  };

  useEffect(() => {
    if (students[editingStudentIndex]) {
      setEditedStudentData({ ...students[editingStudentIndex] });
    } else {
      console.warn("Invalid editingStudentIndex:", editingStudentIndex);
    }
  }, [editingStudentIndex, students]);

  // Prepare a flat array of student data. Append _id for internal use.
  const extractedData = students.map((student) => {
    const formattedData = customLabels.map((label) => {
      if (label === "Name") return student.name;
      if (label === "Email Id") return student.emailId;
      if (label === "Roll No") return student.rollNo;
      if (label === "CGPA") return student.cgpa;
      if (label === "Program") return student.program;
      if (label === "Department") return student.department;
      if (label === "TA Type") return student.taType;
      if (label === "TA Status") return student.allocationStatus;
      if (label === "TA Allotted") return student.allocatedTA;
      if (label.startsWith("Dept Pref ")) {
        const index = parseInt(label.replace("Dept Pref ", ""), 10) - 1;
        return index < student.departmentPreferences.length
          ? student.departmentPreferences[index].course
          : "";
      }
      if (label.startsWith("Grade Dept Pref")) {
        const index = parseInt(label.replace("Grade Dept Pref ", ""), 10) - 1;
        return index < student.departmentPreferences.length
          ? student.departmentPreferences[index].grade
          : "";
      }
      if (label.startsWith("Other Pref ")) {
        const index = parseInt(label.replace("Other Pref ", ""), 10) - 1;
        return index < student.nonDepartmentPreferences.length
          ? student.nonDepartmentPreferences[index].course
          : "";
      }
      if (label.startsWith("Grade Other Pref")) {
        const index = parseInt(label.replace("Grade Other Pref ", ""), 10) - 1;
        return index < student.nonDepartmentPreferences.length
          ? student.nonDepartmentPreferences[index].grade
          : "";
      }
      if (label.startsWith("Non-Prefs ")) {
        const index = parseInt(label.replace("Non-Prefs ", ""), 10) - 1;
        return index < student.nonPreferences.length
          ? student.nonPreferences[index]
          : "";
      }
      return "";
    });
    formattedData.push(student._id);
    return formattedData;
  });

  useEffect(() => {
    setSortedStudent(extractedData);
    // Reset visible rows whenever data changes (e.g., search or sort)
    setVisibleRowCount(20);
  }, [students]);

  const filteredStudents =
    searchQuery === ""
      ? sortedStudent
      : sortedStudent.filter((student) => {
          const values = student.join(" ").toLowerCase();
          return values.includes(searchQuery.toLowerCase());
        });

  const handleSort = (key) => {
    const direction =
      key === sortConfig.key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";
    const sorted = [...sortedStudent].sort((a, b) => {
      const valueA = a[key].toString().toLowerCase();
      const valueB = b[key].toString().toLowerCase();
      if (valueA < valueB) return direction === "ascending" ? -1 : 1;
      if (valueA > valueB) return direction === "ascending" ? 1 : -1;
      return 0;
    });
    setSortConfig({ key, direction });
    setSortedStudent(sorted);
  };

  // Handler to load more rows when the container is scrolled near the bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleRowCount((prev) =>
        Math.min(filteredStudents.length, prev + 10)
      );
    }
  };

  // Render the header row with updated UI classes
  const renderHeaderRow = () => {
    return (
      <tr className="bg-[#3dafaa] text-white">
        <th className="border-b py-3 px-4 text-center font-semibold break-words">
          S.No
        </th>
        {summaryHeaders.map((label, index) => (
          <th className="border-b py-3 px-4 text-center font-semibold break-words" key={index}>
            <button
              className="w-full flex justify-center"
              onClick={() => handleSort(index)}
            >
              {label}
              {sortConfig.key === index &&
                (sortConfig.direction === "ascending" ? (
                  <AiOutlineSortAscending />
                ) : (
                  <AiOutlineSortDescending />
                ))}
            </button>
          </th>
        ))}
        <th className="border-b py-3 px-4 text-center font-semibold break-words">
          Actions
        </th>
      </tr>
    );
  };

  // Render a summary row (and detail row if expanded) with updated cell styling
  const renderSummaryRow = (data, index) => {
    const isEditing = index === editingRow;
    return (
      <React.Fragment key={`row-${index}`}>
        <tr
          className="text-center cursor-pointer"
          onClick={() => {
            if (!isEditing) {
              setExpandedRowIndex(expandedRowIndex === index ? -1 : index);
            }
          }}
        >
          <td className="border-b py-2 px-3 break-words">{index + 1}</td>
          {data.slice(0, 7).map((item, itemIndex) => (
            <td className="border-b py-2 px-3 break-words" key={itemIndex}>
              {isEditing ? (
                <input
                  type="text"
                  value={
                    editedStudentData[studentKeyMapping[customLabels[itemIndex]]] !== undefined
                      ? editedStudentData[studentKeyMapping[customLabels[itemIndex]]]
                      : item
                  }
                  onChange={(e) => handleInputChange(e, customLabels[itemIndex])}
                  className="w-full rounded px-2 py-1 border text-sm"
                />
              ) : (
                item
              )}
            </td>
          ))}
          <td className="border-b py-2 px-3 break-words" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              loader ? (
                <div className="flex justify-center">
                  <ClipLoader
                    color={"#3dafaa"}
                    loading={loader}
                    size={30}
                    aria-label="Loading Spinner"
                  />
                </div>
              ) : (
                <div className="flex">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded-full flex items-center mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(data[24]);
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded-full flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              <div className="flex">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded-full flex items-center mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(index, data[24]);
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded-full flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(data[24]);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </td>
        </tr>
        {expandedRowIndex === index && (
          <tr key={`detail-${index}`}>
            <td colSpan={summaryHeaders.length + 2}>
              <div className="p-2 bg-gray-100">
                <table className="w-full">
                  <tbody>
                    {customLabels.map((label, idx) => (
                      <tr key={idx}>
                        <td className="font-bold border p-1 break-words">{label}</td>
                        <td className="border p-1 break-words">{data[idx]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents);
    XLSX.utils.sheet_add_aoa(ws, [customLabels], { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Students_Downloaded.xlsx");
  };

  return (
    <div>
      <div className="flex mt-4 justify-between">
        <form className="w-[350px]">
          <div className="relative mr-2">
            <input
              type="search"
              placeholder="Search Students..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
        <button
          className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full cursor-pointer font-bold text-sm"
          onClick={handleDownload}
        >
          Download
        </button>
      </div>
      {/* Table container with UI enhancements */}
      <div
        ref={containerRef}
        className="overflow-auto w-full max-h-[80vh] mt-4"
        onScroll={handleScroll}
      >
        <div className="shadow-2xl rounded-3xl overflow-hidden border">
          <table className="w-full border-collapse border">
            <thead className="sticky top-0">{renderHeaderRow()}</thead>
            <tbody>
              {filteredStudents.slice(0, visibleRowCount).map((data, index) =>
                renderSummaryRow(data, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tablestudents;
