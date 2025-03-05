import axios from "axios";
import { useContext, useEffect, useState } from "react";
import {
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import AuthContext from "../context/AuthContext";
import CourseContext from "../context/CourseContext";
import StudentContext from "../context/StudentContext";
import MultiSelect from './Multi';
import PreviewModal from './modal';

const CoursePage = () => {
  const { selectedCourse } = useContext(CourseContext);
  const { students, getStudentsFromBackend } = useContext(StudentContext);
  const [button, setbutton] = useState(false);
  const { user } = useContext(AuthContext);
  const { courseName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [allocatedToThisCourse, setAllocatedToThisCourse] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [allocated, setAllocated] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRound, setCurrentRound] = useState(null);
  const [filters, setFilters] = useState({
    preference: [],
    department: "All",
    program: "All",
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [sorted, setSorted] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const fetchCurrentRound = async () => {
    try {
      const response = await fetch(`${API}/api/rd/currentround`);
      const data = await response.json();
      setCurrentRound(data.currentRound);
    } catch (error) {
      console.error("Error fetching round status:", error);
    }
  };

  useEffect(() => {
    if (!selectedCourse || selectedCourse.name !== courseName) {
      // Redirect to the professor page if conditions are met
      const currentPath = location.pathname;
      const lastIndexOfSlash = currentPath.lastIndexOf("/");

      if (lastIndexOfSlash !== -1) {
        // Extract the modified path
        const modifiedPath = currentPath.substring(0, lastIndexOfSlash);

        // Navigate to the modified path
        navigate(modifiedPath);
      }
    }

    // When the component mounts, sort students into allocated and available lists
    const studentsAllocatedToCourse = students.filter(
      (student) =>
        student.allocationStatus === 1 &&
        student.allocatedTA === selectedCourse.name
    );

    const studentsAvailableForAllocation = students.filter(
      (student) =>
        student.allocationStatus !== 1 ||
        student.allocatedTA !== selectedCourse.name
    );

    fetchCurrentRound();

    setAllocatedToThisCourse(studentsAllocatedToCourse);

    setAvailableStudents(studentsAvailableForAllocation);
  }, [selectedCourse, students, allocated]);

  const handleAllocate = async (studentId) => {
    if (currentRound == null) {
      Swal.fire("Can't Allocate", "No allocation round is going on", "error");
      return;
    }
  
    try {
      await axios.post(`${API}/api/al/allocation`, {
        studentId,
        courseId: selectedCourse._id,
        allocatedByID: user.id,
        allocatedBy: user.role,
      });
  
      // Move the student from available to allocated
      const studentToAllocate = availableStudents.find(
        (student) => student._id === studentId
      );
  
      setAllocatedToThisCourse((prevAllocated) => [
        ...prevAllocated,
        studentToAllocate,
      ]);
      setAvailableStudents((prevAvailable) =>
        prevAvailable.filter((student) => student._id !== studentId)
      );
  
      getStudentsFromBackend();
  
      // Toggle the button state to trigger recalculation
      setbutton((prevState) => !prevState);
    } catch (error) {
      if (error.message === "Request failed with status code 400") {
        Swal.fire("Can't Allocate", "TA limit exceeded.", "error");
      }
      console.error("Error allocating student:", error);
    }
  };
  

  const prefRank = (student) => {
    let count = 0;
    for (const pref of student.departmentPreferences) {
      count++;
      if (pref.course === selectedCourse.name) {
        return count;
      }
    }
    for (const pref of student.nonDepartmentPreferences) {
      count++;
      if (pref.course === selectedCourse.name) {
        return count;
      }
    }
    return 9;
  };
  
  const handleSort = (key) => {
    // Toggle the sorting direction if the same key is clicked again
    const direction =
      key === sortConfig.key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";
  
    const sourceData = allocated === 1 ? allocatedToThisCourse : availableStudents;
    const sortedStudents = [...sourceData].sort((a, b) => {
      if (key === "preference") {
        const rankA = prefRank(a);
        const rankB = prefRank(b);
        return direction === "ascending" ? rankA - rankB : rankB - rankA;
      }
      const valueA = a[key].toString().toLowerCase();
      const valueB = b[key].toString().toLowerCase();
      const compareResult = valueA.localeCompare(valueB);
      return direction === "ascending" ? compareResult : -compareResult;
    });
  
    // Update the sort configuration and sorted data in state
    setSortConfig({ key, direction });
    setSorted(sortedStudents);
  };
  
  const handleDeallocate = async (studentId) => {
    try {
      await axios.post(`${API}/api/al/deallocation`, {
        studentId,
        deallocatedByID: user.id,
        deallocatedBy: user.role,
        courseId: selectedCourse._id,
      });
  
      // Move the student from allocated to available
      const studentToDeallocate = allocatedToThisCourse.find(
        (student) => student._id === studentId
      );
  
      setAvailableStudents((prevAvailable) => [
        ...prevAvailable,
        studentToDeallocate,
      ]);
      setAllocatedToThisCourse((prevAllocated) =>
        prevAllocated.filter((student) => student._id !== studentId)
      );
  
      getStudentsFromBackend();
  
      // Toggle the button state to trigger recalculation
      setbutton((prevState) => !prevState);
    } catch (error) {
      console.error("Error deallocating student:", error);
    }
  };

  if (!selectedCourse) {
    // Render a message or UI indicating that the course data is not available
    return <div>Course data is not available.</div>;
  }

  const handleRenderAllocatedTable = async () => {
    setAllocated(1);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleRenderAvailableStudentTable = async () => {
    setAllocated(0);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleRenderAllocatedToOthersTable = async () => {
    setAllocated(2);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleDownload = () => {
    const sourceData = allocated ? allocatedToThisCourse : availableStudents;
    const dataToDownload = sourceData.map(({ _id, allocationStatus, __v, ...rest }) => rest);
    console.log(dataToDownload);
    const ws = XLSX.utils.json_to_sheet(dataToDownload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(
      wb,
      `${selectedCourse.name}_${allocated ? "Allocated" : "Available"}_Students.xlsx`
    );
  };
  

  const downloadAvailableStudents = () => {
    // Filter students based on the same conditions as renderAvailableRow
    const availableStudents = filteredStudents.filter((student) => {
        let pref = "Not Any";
        let grade = "No Grade";
        const coursePreference = findCourseInPreferences(student, selectedCourse.name);
        if (coursePreference !== null) {
            pref = coursePreference.preferenceType;
            grade = coursePreference.grade;
        }

        // Only include students who meet the conditions to be rendered
        return (
            (pref !== "Not Any" || student.department === selectedCourse.department || currentRound !== 2) &&
            student.allocationStatus === 0
        );
    });

    // Prepare student data
    const studentData = availableStudents.map((student) => {
        let pref = "Not Any";
        let grade = "No Grade";
        const coursePreference = findCourseInPreferences(student, selectedCourse.name);
        if (coursePreference !== null) {
            pref = coursePreference.preferenceType;
            grade = coursePreference.grade;
        }

        return {
            Name: student.name,
            Email: student.emailId,
            Program: student.program,
            Department: student.department,
            CGPA: student.cgpa || "N/A",
            Grade: grade,
            Preference: pref,
        };
    });

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(studentData);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Available Students");

    // Generate and trigger download
    XLSX.writeFile(workbook, "available_students.xlsx");
};


const prepareData = () => {
  const data = allocated ? allocatedToThisCourse : availableStudents;
  return data.map(({ _id, allocationStatus, __v, ...rest }) => rest);
};

const handlePreview = () => {
  setPreviewData(prepareData());
  setIsPreviewModalOpen(true);
};


const filterStudents = (studentsList) => {
  const searchLower = searchQuery.toLowerCase();
  const courseName = selectedCourse.name;

  // Filter by search query
  let filteredStudents = studentsList.filter(
    (student) =>
      student.name.toLowerCase().includes(searchLower) ||
      student.emailId.toLowerCase().includes(searchLower)
  );

  // Filter by preference if applicable
  if (filters.preference.length > 0 && !filters.preference.includes("All")) {
    filteredStudents = filteredStudents.filter((student) => {
      let pref = "Not Any";
      let count = 1;
      for (const dp of student.departmentPreferences) {
        if (dp.course === courseName) {
          pref = `Dept Preference ${count}`;
          break;
        }
        count++;
      }
      count = 1;
      for (const ndp of student.nonDepartmentPreferences) {
        if (pref !== "Not Any") break;
        if (ndp.course === courseName) {
          pref = `Non-Department Preference ${count}`;
          break;
        }
        count++;
      }
      for (const np of student.nonPreferences) {
        if (pref !== "Not Any") break;
        if (np === courseName) {
          pref = `Not Preferred`;
          break;
        }
      }
      return filters.preference.includes(pref);
    });
  }

  // Filter by department if applicable
  if (filters.department !== "All") {
    filteredStudents = filteredStudents.filter(
      (student) => student.department === filters.department
    );
  }

  // Filter by program if applicable
  if (filters.program !== "All") {
    filteredStudents = filteredStudents.filter(
      (student) => student.program === filters.program
    );
  }

  return filteredStudents;
};

  

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredStudents = filterStudents(
    sortConfig.key === null
      ? allocated === 1
        ? allocatedToThisCourse
        : availableStudents
      : sorted
  );

  // Function to check if a course is in the student's preferences

  const findCourseInPreferences = (student, courseName) => {
    // Helper function to search through a list of preferences
    const searchPreference = (preferences, label) => {
      let count = 1;
      for (const preference of preferences) {
        if (preference.course === courseName) {
          return {
            preferenceType: `${label} Preference ${count}`,
            grade: preference.grade,
          };
        }
        count++;
      }
      return null;
    };
  
    // Search in department preferences
    const deptPref = searchPreference(student.departmentPreferences, "Department");
    if (deptPref) return deptPref;
  
    // Search in non-department preferences
    const nonDeptPref = searchPreference(student.nonDepartmentPreferences, "Non-Department");
    if (nonDeptPref) return nonDeptPref;
  
    // Search in non-preferences (using selectedCourse.name as in the original)
    for (const pref of student.nonPreferences) {
      if (pref === selectedCourse.name) {
        return {
          preferenceType: "Not Preferred",
          grade: "No Grade",
        };
      }
    }
  
    return null; // Course not found in preferences
  };
  

  // Updated renderAllocatedRow function
  const renderAllocatedRow = (student) => {
    let pref = "Not Any";
    let grade = "No Grade";
    const coursePreference = findCourseInPreferences(student, selectedCourse.name);
    if (coursePreference !== null) {
      pref = coursePreference.preferenceType;
      grade = coursePreference.grade;
    }
  
    // Determine whether to show additional columns based on currentRound
    const showExtraColumns = currentRound !== 1;
    // Determine whether to show the deallocate button
    const showDeallocateButton = !(user.role === "professor" && (currentRound === null || currentRound > 1));
  
    return (
      <tr className="text-center">
        <td className="border p-2">{student.name}</td>
        <td className="border p-2">{student.emailId}</td>
        <td className="border p-2">{student.program}</td>
        <td className="border p-2">{student.department}</td>
        {showExtraColumns && (
          <>
            <td className="border p-2">{student.cgpa}</td>
            <td className="border p-2">{grade}</td>
            <td className="border p-2">{pref}</td>
          </>
        )}
        {showDeallocateButton && (
          <td className="border p-2">
            <button
              className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer font-bold"
              onClick={() => handleDeallocate(student._id)}
            >
              Deallocate
            </button>
          </td>
        )}
      </tr>
    );
  };

const renderAvailableRow = (student) => {
  let pref = "Not Any";
  let grade = "No Grade";
  const coursePreference = findCourseInPreferences(student, selectedCourse.name);
  if (coursePreference !== null) {
    pref = coursePreference.preferenceType;
    grade = coursePreference.grade;
  }

  // Only render the row if one of these conditions is true and allocationStatus is 0
  const shouldRenderRow =
    (pref !== "Not Any" ||
      student.department === selectedCourse.department ||
      currentRound !== 2) &&
    student.allocationStatus === 0;

  if (!shouldRenderRow) return null;

  // Determine if extra columns (cgpa, grade, pref) should be shown
  const showExtraColumns = currentRound !== 1;

  // Determine if the Allocate button should be shown
  const showAllocateButton =
    !(user.role === "professor" && (currentRound === null || currentRound > 1));

  // Determine button styling and disabled state
const allocateButtonClass =
student.allocationStatus === 1 && student.allocatedTA !== selectedCourse.name
  ? "bg-gray-400 cursor-not-allowed"
  : "bg-[#6495ED] hover:bg-[#3b6ea5] cursor-pointer";
const allocateButtonDisabled =
student.allocationStatus === 1 &&
student.allocatedTA !== selectedCourse.name &&
currentRound === null;

  return (
    <tr className="text-center">
      <td className="border p-2">{student.name}</td>
      <td className="border p-2">{student.emailId}</td>
      <td className="border p-2">{student.program}</td>
      <td className="border p-2">{student.department}</td>
      {showExtraColumns && (
        <>
          <td className="border p-2">{student.cgpa}</td>
          <td className="border p-2">{grade}</td>
          <td className="border p-2">{pref}</td>
        </>
      )}
      {showAllocateButton && (
        <td className="border p-2">
          <button
            className={`${allocateButtonClass} text-white px-2 py-1 rounded-full font-bold text-sm`}
            onClick={() => handleAllocate(student._id)}
            disabled={allocateButtonDisabled}
          >
            Allocate
          </button>
        </td>
      )}
    </tr>
  );
};


const renderAllocatedToOthers = (student) => {
  let pref = "Not Any";
  let grade = "No Grade";
  const coursePreference = findCourseInPreferences(student, selectedCourse.name);
  if (coursePreference !== null) {
    pref = coursePreference.preferenceType;
    grade = coursePreference.grade;
  }

  // Only render if student is allocated and the allocatedTA is not the selected course name
  if (!(student.allocationStatus === 1 && student.allocatedTA !== selectedCourse.name)) {
    return null;
  }

  return (
    <tr className="text-center">
      <td className="border p-2">{student.name}</td>
      <td className="border p-2">{student.emailId}</td>
      <td className="border p-2">{student.program}</td>
      <td className="border p-2">{student.department}</td>
      {currentRound === 1 ? null : (
        <>
          <td className="border p-2">{student.cgpa}</td>
          <td className="border p-2">{grade}</td>
          <td className="border p-2">{pref}</td>
        </>
      )}
      <td className="border p-2">{student.allocatedTA}</td>
    </tr>
  );
};

  const handlePrefFilter = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    setFilters((prevFilters) => ({
      ...prevFilters,
      preference: selectedOptions,
    }));
  };

  const handleProgramFilter = (event) => {
    setFilters((prevFilters) => ({
      ...prevFilters, // Keep the previous state
      program: event.target.value, // Update the program property
    }));
  };

  const handleDepartmentFilter = (event) => {
    setFilters((prevFilters) => ({
      ...prevFilters, // Keep the previous state
      department: event.target.value, // Update the department property
    }));
  };



  const handleHomeClick = () => {
    if(user.role ==="jm"){
      navigate('/department/');
    }
    if(user.role==="admin"){
      navigate('/admin/');
    }
    if(user.role==="professor"){
      navigate('/professor/');
    }
  };


  const renderCommonHeader = (title, currentRound, handlePrefFilter) => {
    return (
      <div className="flex">
        <h2 className="text-2xl font-bold mb-2 mr-2">{title}</h2>
        {currentRound !== 1 && (
          <div className="mb-1 mr-2">
          <h2 className="mt-2 mr-2 inline-block">Preference:</h2>
          <MultiSelect
            options={[
              "All",
              "Dept Preference 1",
              "Dept Preference 2",
              "Non-Department Preference 1",
              "Non-Department Preference 2",
              "Non-Department Preference 3",
              "Non-Department Preference 4",
              "Non-Department Preference 5",
              "Not Preferred",
              "Not Any"
            ]}
            onChange={handlePrefFilter}
          />
        </div>
        )}
        <div className="mb-1 mr-2">
          <h2 className="mt-2 mr-2 inline-block">Program:</h2>
          <select
            name=""
            id=""
            className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
            onChange={handleProgramFilter}
          >
            <option value="All">All</option>
            <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
            <option value="B.Tech 4th Year">B.Tech 4th Year</option>
            <option value="M.Tech 1st Year">M.Tech 1th Year</option>
            <option value="M.Tech 2nd Year">M.Tech 2nd Year</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="mb-1 mr-2">
          <h2 className="mt-2 mr-2 inline-block">Department:</h2>
          <select
            name=""
            id=""
            className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
            onChange={handleDepartmentFilter}
          >
            <option value="All">All</option>
            <option value="CSE">CSE</option>
            <option value="CB">CB</option>
            <option value="Maths">Maths</option>
            <option value="HCD">HCD</option>
            <option value="ECE">ECE</option>
            <option value="SSH">SSH</option>
          </select>
        </div>
        {title === "Available Students" && (
        <button
        onClick={downloadAvailableStudents}
        className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
      >
        Download
      </button>
      
      )}
      </div>
    );
  };

  // New ModularTable component for reusability
const ModularTable = ({ children }) => (
  <div className="shadow-2xl rounded-3xl overflow-hidden border">
    <table className="w-full border-collapse border">
      {children}
    </table>
  </div>
);

const renderSortButton = (label, sortKey) => (
  <button onClick={() => handleSort(sortKey)} className="flex justify-center">
    {label}{" "}
    {sortConfig.key === sortKey &&
      (sortConfig.direction === "ascending" ? (
        <AiOutlineSortAscending />
      ) : (
        <AiOutlineSortDescending />
      ))}
  </button>
);

return (
  <div>
    <div className="flex">
      <h1 className="text-2xl font-bold m-5">{selectedCourse.name},</h1>
      <div className="flex items-center">
        <p className="text-1xl font-bold mr-2">Ongoing Round:</p>
        <p className="text-1xl flex mr-1">Round</p>
        <p className="text-1xl flex mr-1">{currentRound}</p>
      </div>
    </div>

    <div className="flex justify-between">
      <div className="flex">
        <button
          type="button"
          className="px-4 py-1 rounded-full cursor-pointer border border-[#3dafaa] text-[#3dafaa] hover:bg-[#3dafaa] hover:text-white mr-4"
          onClick={handleHomeClick}
        >
          Home
        </button>
        <button
          type="button"
          className={`px-4 py-1 rounded-full cursor-pointer border border-[#3dafaa] ${
            allocated === 0 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
          } hover:bg-[#3dafaa] hover:text-white mr-4`}
          onClick={handleRenderAvailableStudentTable}
        >
          Available Student
        </button>
        <button
          type="button"
          className={`px-4 py-1 rounded-full cursor-pointer border border-[#3dafaa] ${
            allocated === 1 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
          } hover:bg-[#3dafaa] hover:text-white mr-2`}
          onClick={handleRenderAllocatedTable}
        >
          Student Allocated to {selectedCourse.acronym}
        </button>
        <button
          type="button"
          className={`px-4 py-1 rounded-full cursor-pointer border border-[#3dafaa] ${
            allocated === 2 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
          } hover:bg-[#3dafaa] hover:text-white mr-2`}
          onClick={handleRenderAllocatedToOthersTable}
        >
          Student Allocated to others courses
        </button>

        <form className="w-[350px]">
          <div className="relative mr-2">
            <input
              type="search"
              placeholder="Search Student..."
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
              value={searchQuery}
              onChange={handleSearch}
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
      </div>
      {allocated === 1 && (
        <div>
          <button
            className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold mr-6"
            onClick={handlePreview}
          >
            Preview Data
          </button>
          <button
            className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold mr-6"
            onClick={handleDownload}
          >
            Download
          </button>
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            data={previewData}
            courseTitle={selectedCourse.name}
            allocated={allocated}
            currentRound={currentRound}
          />
        </div>
      )}
    </div>

    {allocated === 1 && (
      <div className="m-5">
        {renderCommonHeader(
          `Allocated Students to ${courseName}`,
          currentRound,
          handlePrefFilter
        )}

        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <ModularTable>
            <thead className="sticky top-0">
              <tr className="bg-[#3dafaa] text-white">
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Name", "name")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Email", "emailId")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Program", "program")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Department", "department")}
                  </div>
                </th>
                {currentRound !== 1 && (
                  <>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("CGPA", "cgpa")}
                      </div>
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      Grade
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("Preference", "preference")}
                      </div>
                    </th>
                  </>
                )}
                {user.role === "professor" &&
                (currentRound === null || currentRound > 1) ? null : (
                  <th className="border p-2 bg-[#3dafaa] text-white">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => renderAllocatedRow(student))}
            </tbody>
          </ModularTable>
        </div>
      </div>
    )}

    {allocated === 0 && (
      <div className="m-5">
        {renderCommonHeader("Available Students", currentRound, handlePrefFilter)}
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <ModularTable>
            <thead className="sticky top-0">
              <tr className="bg-[#3dafaa] text-white">
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Name", "name")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Email", "emailId")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Program", "program")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Department", "department")}
                  </div>
                </th>
                {currentRound !== 1 && (
                  <>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("CGPA", "cgpa")}
                      </div>
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      Grade
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("Preference", "preference")}
                      </div>
                    </th>
                  </>
                )}
                {user.role === "professor" &&
                (currentRound === null || currentRound > 1) ? null : (
                  <th className="border p-2 bg-[#3dafaa] text-white">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => renderAvailableRow(student))}
            </tbody>
          </ModularTable>
        </div>
      </div>
    )}

    {allocated === 2 && (
      <div className="m-5">
        <div className="flex">
          <h2 className="text-2xl font-bold mb-2 mr-2">
            Allocated Students to other courses
          </h2>
          {currentRound !== 0 && (
            <div className="mb-1 mr-2">
              <h2 className="mt-2 mr-2 inline-block">Preference:</h2>
              <MultiSelect
                options={[
                  "All",
                  "Dept Preference 1",
                  "Dept Preference 2",
                  "Non-Department Preference 1",
                  "Non-Department Preference 2",
                  "Non-Department Preference 3",
                  "Non-Department Preference 4",
                  "Non-Department Preference 5",
                  "Not Preferred",
                  "Not Any",
                ]}
                onChange={handlePrefFilter}
              />
            </div>
          )}
          <div className="mb-1 mr-2">
            <h2 className="mt-2 mr-2 inline-block">Program:</h2>
            <select
              className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
              onChange={handleProgramFilter}
            >
              <option value="All">All</option>
              <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
              <option value="B.Tech 4th Year">B.Tech 4th Year</option>
              <option value="M.Tech 1th Year">M.Tech 1th Year</option>
              <option value="M.Tech 2nd Year">M.Tech 2nd Year</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="mb-1 mr-2">
            <h2 className="mt-2 mr-2 inline-block">Department:</h2>
            <select
              className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
              onChange={handleDepartmentFilter}
            >
              <option value="All">All</option>
              <option value="CSE">CSE</option>
              <option value="CB">CB</option>
              <option value="Maths">Maths</option>
              <option value="HCD">HCD</option>
              <option value="ECE">ECE</option>
              <option value="SSH">SSH</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <ModularTable>
            <thead className="sticky top-0">
              <tr className="bg-[#3dafaa] text-white">
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Name", "name")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Email", "emailId")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Program", "program")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Department", "department")}
                  </div>
                </th>
                {currentRound !== 1 && (
                  <>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("CGPA", "cgpa")}
                      </div>
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      Grade
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("Preference", "preference")}
                      </div>
                    </th>
                  </>
                )}
                <th className="border p-2 bg-[#3dafaa] text-white">
                  Allocated To
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) =>
                renderAllocatedToOthers(student)
              )}
            </tbody>
          </ModularTable>
        </div>
      </div>
    )}
  </div>
);
};

export default CoursePage;
