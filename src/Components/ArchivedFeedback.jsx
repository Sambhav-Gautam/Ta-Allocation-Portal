import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ArchivedFeedback = () => {
  const [archivedFeedback, setArchivedFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSemester, setSearchSemester] = useState("");
  const API = import.meta.env.VITE_API_URL;
  const tableContainerRef = useRef(null);

  useEffect(() => {
    const fetchArchivedFeedback = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/archived-feedback`);
        setArchivedFeedback(res.data);
        setFilteredFeedback(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching archived feedback: ", error);
        setLoading(false);
      }
    };

    fetchArchivedFeedback();
  }, []);

  useEffect(() => {
    if (searchSemester) {
      setFilteredFeedback(
        archivedFeedback.filter((feedback) =>
          feedback.semester.toLowerCase().includes(searchSemester.toLowerCase())
        )
      );
    } else {
      setFilteredFeedback(archivedFeedback);
    }
  }, [searchSemester, archivedFeedback]);

  const downloadFeedback = async () => {
    try {
      const response = await axios.get(`${API}/api/feedback/download`, {
        responseType: 'arraybuffer',
      });
  
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
  
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ArchivedFeedback.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
  
      console.log("Archived feedback downloaded successfully");
    } catch (error) {
      console.error("Error downloading archived feedback: ", error);
      alert("Failed to download archived feedback. Please try again.");
    }
  };

  if (loading) return <p>Loading archived feedback...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Archived Feedback</h1>
      
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by Semester"
          value={searchSemester}
          onChange={(e) => setSearchSemester(e.target.value)}
          className="border px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={downloadFeedback}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Download
        </button>
      </div>

      <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto w-[90%] max-w-[1200px] h-[400px] mt-4 border rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Course</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Student</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Professor</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Overall Grade</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Regularity In Meeting</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Attendance In Lectures</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Preparedness For Tutorials</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Timeliness Of Tasks</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Quality Of Work</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Attitude Commitment</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Nominated For Best TA</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Comments</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Semester</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Archived Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFeedback.map((feedback) => (
              <tr key={feedback._id}>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.course.name}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.student.name}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.professor.name}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.overallGrade}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.regularityInMeeting}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.attendanceInLectures}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.preparednessForTutorials}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.timelinessOfTasks}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.qualityOfWork}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.attitudeCommitment}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.nominatedForBestTA ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-sm text-gray-700 break-words">{feedback.comments}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{feedback.semester}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{new Date(feedback.archivedDate).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchivedFeedback;
