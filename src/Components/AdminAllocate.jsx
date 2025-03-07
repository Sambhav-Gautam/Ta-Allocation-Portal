// import React, { useContext, useEffect, useState } from "react";
// import { AiOutlineSearch } from "react-icons/ai";
// import { useNavigate } from "react-router-dom";
// import * as XLSX from "xlsx";
// import "../App.css";
// import AuthContext from "../context/AuthContext";
// import CourseContext from "../context/CourseContext";
// import DepartmentContext from "../context/DepartmentContext";
// import AllocateHeader from "./AllocateHeader";

// const Department = () => {
//   const { departmentCourses } = useContext(DepartmentContext);
//   const { setSelectedCourse, selectedCourse } = useContext(CourseContext);
//   const { user } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentRound, setCurrentRound] = useState(null);
//   const [allocationStatus, setAllocationStatus] = useState("All");
//   const header = [
//     "Name",
//     "Code",
//     "Acronym",
//     "Department",
//     "Credits",
//     "Faculty",
//     "Total Students",
//     "TA Required",
//     "TA Allocated",
//     "Action",
//   ];

//   const API = import.meta.env.VITE_API_URL;

//   const fetchCurrentRound = async () => {
//     try {
//       const response = await fetch(`${API}/api/rd/currentround`);
//       const data = await response.json();
//       setCurrentRound(data.currentRound);
//     } catch (error) {
//       console.error("Error fetching round status:", error);
//     }
//   };

//   useEffect(() => {
//     fetchCurrentRound();
//   }, []);

//   const allocateCourse = (course) => {
//     let courseName = course.name;
//     setSelectedCourse(course); //dont delete

//     navigate(`${courseName}`);
//   };

//   const renderHeaderRow = () => {
//     if (departmentCourses.length === 0) {
//       return (
//         <tr>
//           <th className="bg-[#3dafaa] text-center font-bold p-2 text-white">
//             Course Data
//           </th>
//         </tr>
//       );
//     } else {
//       return (
//         <tr className="bg-[#3dafaa] text-white">
//           {header.map((key, index) => (
//             // Use index to skip rendering the first column
//             <th className="border p-2 text-center" key={key}>
//               {key}
//             </th>
//           ))}
//         </tr>
//       );
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   const filteredCourseByAllocationStatus = (departmentCourses) => {
//     const courseList = [];
//     if (allocationStatus === "All") {
//       return departmentCourses;
//     } else if (allocationStatus === "Over Allocation") {
//       for (const course of departmentCourses) {
//         if (course.taAllocated.length > course.taRequired) {
//           courseList.push(course);
//         }
//       }
//     } else if (allocationStatus === "Under Allocation") {
//       for (const course of departmentCourses) {
//         if (course.taAllocated.length < course.taRequired) {
//           courseList.push(course);
//         }
//       }
//     } else if (allocationStatus === "Complete Allocation") {
//       for (const course of departmentCourses) {
//         if (course.taAllocated.length == course.taRequired) {
//           courseList.push(course);
//         }
//       }
//     }
//     return courseList;
//   };

//   const filteredCourses = filteredCourseByAllocationStatus(
//     departmentCourses
//   ).filter(
//     (course) =>
//       (user.department === "all" || course.department === user.department) &&
//       (course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         course.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         course.code.toLowerCase().includes(searchQuery.toLowerCase()))
//   );

//   const handleAllocationStatus = (event) => {
//     setAllocationStatus(event.target.value);
//   };

//   const lastCompletedRound = async () => {
//     try {
//       const response = await fetch(`${API}/api/rd/getLastRound`);
//       if (response.status === 200) {
//         const res = await response.json();
//         return res.Round; // Return the round number
//       } else {
//         const res = await response.json();
//         alert(res.message);
//       }
//     } catch (error) {
//       console.error("Error fetching last completed round:", error);
//     }
//   };

//   const handleDownloadAllocations = async () => {
//     try {
//       let lastRoundValue;
//       if (currentRound == null) {
//         lastRoundValue = await lastCompletedRound(); // Wait for lastCompletedRound to finish
//       }
//       const response = await fetch(
//         `${API}/api/al/getAllAllocation`
//       );

//       if (response.status == 200) {
//         const res = await response.json();
//         const ws = XLSX.utils.json_to_sheet(res.data);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "Students");
//         XLSX.writeFile(
//           wb,
//           `Round_${
//             currentRound == null ? lastRoundValue : currentRound
//           }_Allocation.xlsx`
//         );
//       } else {
//         const res = await response.json();
//         alert(res.message);
//       }
//     } catch (error) {
//       console.error("Error downloading complete allocation:", error);
//     }
//   };

//   return (
//     <div>
//       <AllocateHeader />
//       <div className="flex items-center mb-4 justify-between">
//         {/* Search bar display and Allocation status filter */}
//         <div className="flex items-center">
//           <form className="w-[500px] relative mr-3">
//             <div className="relative">
//               <input
//                 type="search"
//                 placeholder="Search Course by Name/Code/Acronym..."
//                 value={searchQuery}
//                 onChange={handleSearch}
//                 className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus.border-[#3dafaa]"
//               />
//               <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button">
//                 <AiOutlineSearch />
//               </button>
//             </div>
//           </form>
//           <div className="flex items-center">
//             <p className="font-bold mr-1">Allocation Status:</p>
//             <select
//               name=""
//               id=""
//               className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
//               onChange={handleAllocationStatus}
//             >
//               <option value="All">All</option>
//               <option value="Over Allocation" className="text-red-500">
//                 Over Allocation
//               </option>
//               <option value="Under Allocation" className="text-yellow-500">
//                 Under Allocation
//               </option>
//               <option value="Complete Allocation">Complete Allocation</option>
//             </select>
//           </div>
//         </div>

//         {/* Download all courses allocation */}
//         <button
//           className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold mr-6"
//           onClick={handleDownloadAllocations}
//         >
//           Download all courses allocation
//         </button>
//       </div>
//       <div className="max-w-full max-h-[75vh] overflow-auto">
//         <table className="border-collapse border w-full">
//           <thead className="sticky top-0">{renderHeaderRow()}</thead>
//           <tbody>
//             {filteredCourses.map((row, index) => (
//               <tr className="text-center" key={index}>
//                 {Object.values(row).map((data, ind) =>
//                   ind !== 0 && ind !== 10 && ind !== 8 ? (
//                     <td
//                       className={`border p-2 ${
//                         row.taAllocated.length > row.taRequired
//                           ? "text-red-500"
//                           : row.taAllocated.length < row.taRequired &&
//                             currentRound >= 2
//                           ? "text-yellow-500"
//                           : "text-black"
//                       }`}
//                       key={ind}
//                     >
//                       {ind === 11 ? row.taAllocated.length : data}
//                     </td>
//                   ) : null
//                 )}
//                 <td className="border p-2">
//                   <button
//                     onClick={() => allocateCourse(row)}
//                     className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold"
//                   >
//                     Allocate
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Department;
import React, { useContext, useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "../App.css";
import AuthContext from "../context/AuthContext";
import CourseContext from "../context/CourseContext";
import DepartmentContext from "../context/DepartmentContext";
import AllocateHeader from "./AllocateHeader";
import PreviewModal from './modal';
import AllCoursesPreviewModal from './allshow';
// import CourseState from "../context/CourseState";


const Department = () => {
  const { departmentCourses } = useContext(DepartmentContext);
  const { setSelectedCourse, selectedCourse,courses } = useContext(CourseContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRound, setCurrentRound] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  // const { courses} = useState(CourseState);
  const header = [
    "Name",
    "Code",
    "Acronym",
    "Department",
    "Credits",
    "Faculty",
    "Total Students",
    "TA Required",
    "TA Allocated",
    "Action",
  ];

  const API = import.meta.env.VITE_API_URL;

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
    fetchCurrentRound();
  }, []);

  const allocateCourse = (course) => {
    let courseName = course.name;
    setSelectedCourse(course); //don't delete

    navigate(`${courseName}`);
  };

  const renderHeaderRow = () => {
    if (departmentCourses.length === 0) {
      return (
        <tr>
          <th className="bg-[#3dafaa] text-center font-bold p-2 text-white">
            Course Data
          </th>
        </tr>
      );
    } else {
      return (
        <tr className="bg-[#3dafaa] text-white">
          {header.map((key) => (
            <th className="border p-2 text-center" key={key}>
              {key}
            </th>
          ))}
        </tr>
      );
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredCourseByAllocationStatus = (departmentCourses) => {
    const courseList = [];
    if (allocationStatus === "All") {
      console.log(departmentCourses);
      return departmentCourses;
    } else if (allocationStatus === "Over Allocation") {
      for (const course of departmentCourses) {
        if (course.taAllocated.length > course.taRequired) {
          courseList.push(course);
        }
      }
    } else if (allocationStatus === "Under Allocation") {
      for (const course of departmentCourses) {
        if (course.taAllocated.length < course.taRequired) {
          courseList.push(course);
        }
      }
    } else if (allocationStatus === "Complete Allocation") {
      for (const course of departmentCourses) {
        if (course.taAllocated.length == course.taRequired) {
          courseList.push(course);
        }
      }
    }
    return courseList;
  };

  const filteredCourses = filteredCourseByAllocationStatus(
    departmentCourses
  ).filter(
    (course) =>
      (user.department === "all" || course.department === user.department) &&
      (course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAllocationStatus = (event) => {
    setAllocationStatus(event.target.value);
  };

  const lastCompletedRound = async () => {
    try {
      const response = await fetch(`${API}/api/rd/getLastRound`);
      if (response.status === 200) {
        const res = await response.json();
        return res.Round; // Return the round number
      } else {
        const res = await response.json();
        alert(res.message);
      }
    } catch (error) {
      console.error("Error fetching last completed round:", error);
    }
  };

  const handleDownloadAllocations = async () => {
    try {
      let lastRoundValue;
      if (currentRound == null) {
        lastRoundValue = await lastCompletedRound(); // Wait for lastCompletedRound to finish
      }
      const response = await fetch(`${API}/api/al/getAllAllocation`);

      if (response.status == 200) {
        const res = await response.json();
        const ws = XLSX.utils.json_to_sheet(res.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(
          wb,
          `Round_${
            currentRound == null ? lastRoundValue : currentRound
          }_Allocation.xlsx`
        );
      } else {
        const res = await response.json();
        alert(res.message);
      }
    } catch (error) {
      console.error("Error downloading complete allocation:", error);
    }
  };



  const prepareData = () => {
    return allocated
      ? allocatedToThisCourse.map(
          ({ _id, allocationStatus, __v, ...rest }) => rest
        )
      : availableStudents.map(
          ({ _id, allocationStatus, __v, ...rest }) => rest
        );
  };

  const handlePreview = () => {
    const dataToPreview = prepareData();
    setPreviewData(dataToPreview);
    setIsPreviewModalOpen(true);
  };


  const handleEmailReminders = async (allocationStatus) => {
    try {
      console.log('Starting handleEmailReminders function');
      
      // Construct the API endpoint
      const endpoint = `${API}/api/snd/sendem`;
      console.log(`API Endpoint: ${endpoint}`);
      
      // Prepare the request options
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ allocationStatus : allocationStatus }),
      };
      console.log('Request Options:', requestOptions);
  
      // Send the POST request
      const response = await fetch(endpoint, requestOptions);
      console.log('Response received:', response);
  
      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.message || 'Network response was not ok');
      }
  
      // Parse the JSON response
      const result = await response.json();
      console.log('Email reminders sent successfully:', result);
  
      // Display a success message to the user
      alert('Email reminders sent successfully!');
    } catch (error) {
      console.error('Error sending email reminders:', error);
      alert(`Error sending email reminders: ${error.message}`);
    }
  };
  
  

  return (
    <div>
      <AllocateHeader />
      <div className="flex items-center mb-4 justify-between">
        {/* Search bar display and Allocation status filter */}
        <div className="flex items-center">
          <form className="w-[500px] relative mr-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search Course by Name/Code/Acronym..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus.border-[#3dafaa]"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button">
                <AiOutlineSearch />
              </button>
            </div>
          </form>
          <div className="flex items-center">
            <p className="font-bold mr-1">Allocation Status:</p>
            <select
              name=""
              id=""
              className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
              onChange={handleAllocationStatus}
            >
              <option value="All">All</option>
              <option value="Over Allocation" className="text-red-500">
                Over Allocation
              </option>
              <option value="Under Allocation" className="text-yellow-500">
                Under Allocation
              </option>
              <option value="Complete Allocation">Complete Allocation</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          {(allocationStatus === "Over Allocation" && user.role==="admin" ||
            allocationStatus === "Under Allocation" && user.role==="admin") && (
            <button
              className="bg-[#ff3333] text-white px-4 py-2 rounded cursor-pointer font-bold mr-4"
              
              onClick={() => handleEmailReminders(allocationStatus)}
            >
              Email Reminder
            </button>
          )}
          {/* <button
            className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold"
            
            onClick={() => setIsModalOpen(true)}>
            Preview All Courses
            </button>
         <AllCoursesPreviewModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      // coursesData={courses}
      currentRound={currentRound}
        /> */}
          <button
            className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold"
            onClick={handleDownloadAllocations}
          >
            Download all courses allocation
          </button>
          
        </div>
      </div>
      <div className="max-w-full max-h-[75vh] overflow-auto">
        <table className="border-collapse border w-full">
          <thead className="sticky top-0">{renderHeaderRow()}</thead>
          <tbody>
            {filteredCourses.map((row, index) => (
              <tr className="text-center" key={index}>
                {Object.values(row).map((data, ind) =>
                  ind !== 0 && ind !== 10 && ind !== 8 ? (
                    <td
                      className={`border p-2 ${
                        row.taAllocated.length > row.taRequired
                          ? "text-red-500"
                          : row.taAllocated.length < row.taRequired &&
                            currentRound >= 2
                          ? "text-yellow-500"
                          : "text-black"
                      }`}
                      key={ind}
                    >
                      {ind === 11 ? row.taAllocated.length : data}
                    </td>
                  ) : null
                )}
                <td className="border p-2">
                  <button
                    onClick={() => allocateCourse(row)}
                    className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold"
                  >
                    Allocate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Department;
