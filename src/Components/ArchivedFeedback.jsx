import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ArchivedFeedback = () => {
  const [archivedFeedback, setArchivedFeedback] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [allSemesters, setAllSemesters] = useState([]); // new state for semesters
  const API = import.meta.env.VITE_API_URL;
  const tableContainerRef = useRef(null);
  const limit = 20; // number of rows per request

  // Fetch unique semesters on component mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axios.get(`${API}/api/archived-feedback/semesters`);
        setAllSemesters(res.data.semesters);
      } catch (error) {
        console.error("Error fetching semesters:", error);
      }
    };
    fetchSemesters();
  }, [API]);

  // Function to fetch archived feedback for a given page
  const fetchArchivedFeedback = async (pageNumber) => {
    try {
      setLoading(true);
      const query = selectedSemester
        ? `?semester=${selectedSemester}&page=${pageNumber}&limit=${limit}`
        : `?page=${pageNumber}&limit=${limit}`;
      const res = await axios.get(`${API}/api/archived-feedback${query}`);
      const newFeedback = res.data.archivedFeedback || [];
      setTotal(res.data.total || 0);
      // Append newly fetched data
      setArchivedFeedback((prev) => [...prev, ...newFeedback]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching archived feedback:", error);
      setLoading(false);
    }
  };

  // Fetch page 1 initially and whenever semester changes
  useEffect(() => {
    setPage(1);
    setArchivedFeedback([]);
    fetchArchivedFeedback(1);
  }, [selectedSemester]);

  // Handle scroll: if near bottom and not all feedback loaded, fetch next page
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && archivedFeedback.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArchivedFeedback(nextPage);
    }
  };

  const downloadFeedback = async () => {
    try {
      // Include semester filter if selected
      const query = selectedSemester ? `?semester=${selectedSemester}` : "";
      const response = await axios.get(`${API}/api/archived-feedback/download${query}`, {
        responseType: "arraybuffer", // Use arraybuffer for binary data
      });
      
      // Create a blob from the response data
      const blob = new Blob(
        [response.data],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );
      const url = window.URL.createObjectURL(blob);
  
      // Dynamically set file name based on the selected semester
      const fileName = selectedSemester 
        ? `archivedFeedback_${selectedSemester}.xlsx` 
        : "archivedFeedback.xlsx";
  
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading feedback:", error);
    }
  };
  

  return (
    <div className="p-4 h-full">
      <h1 className="text-xl font-bold mb-4">Archived Feedback</h1>

      <div className="mb-4 flex gap-4">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="border px-3 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-[#6495ED]"
        >
          <option value="">All Semesters</option>
          {allSemesters.map((semester) => (
            <option key={semester} value={semester}>
              {semester}
            </option>
          ))}
        </select>
        <button
          onClick={downloadFeedback}
          className="bg-[#6495ED] text-white px-3 py-1 rounded-full shadow hover:bg-[#3b6ea5] focus:outline-none focus:ring-2 focus:ring-[#6495ED] focus:ring-offset-2"
        >
          Download
        </button>
      </div>

      {loading && archivedFeedback.length === 0 ? (
        <p>Loading archived feedback...</p>
      ) : (
        <div
          ref={tableContainerRef}
          className="overflow-auto w-full h-[calc(100vh-200px)] mt-4 border rounded-lg shadow-lg"
          onScroll={handleScroll}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-[#3dafaa] shadow-lg rounded-lg p-3">
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Course</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Student</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Professor</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Overall Grade</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Nominated For Best TA</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Comments</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Semester</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-white">Archived Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedFeedback.map((feedback) => (
                <tr key={feedback._id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.course?.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.student?.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.professor?.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.overallGrade}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.nominatedForBestTA ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 break-words">{feedback.comments}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{feedback.semester}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {new Date(feedback.archivedDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {archivedFeedback.length < total && (
            <div className="p-4 text-center text-gray-500">Loading more feedback...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchivedFeedback;
