import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';

const FeedbackList = () => {
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editableFeedbackId, setEditableFeedbackId] = useState(null);
  const [editedFeedback, setEditedFeedback] = useState({});
  // Track current page (for server-side pagination)
  const [page, setPage] = useState(1);
  // Total count returned by backend
  const [total, setTotal] = useState(0);
  const containerRef = useRef();
  const API = import.meta.env.VITE_API_URL;
  const limit = 20; // number of rows per request

  useEffect(() => {
    // Reset when user changes or for a new search (if you add search parameter to backend)
    setPage(1);
    setFeedbacks([]);
    fetchFeedbacks(1);
  }, [user]);

  const fetchFeedbacks = async (pageNumber) => {
    try {
      let response;
      if (user && user.role === 'professor') {
        // If your professor endpoint supports pagination, add ?page=&limit=
        response = await axios.get(`${API}/api/feedback/professor/${user.id}?page=${pageNumber}&limit=${limit}`);
      } else if (user && user.role === 'admin') {
        response = await axios.get(`${API}/api/feedback/all?page=${pageNumber}&limit=${limit}`);
      }
      const fetchedFeedbacks = response?.data.feedbacks || [];
      setTotal(response?.data.total || 0);
      // Append the newly fetched page of feedbacks to the existing list
      setFeedbacks((prev) => [...prev, ...fetchedFeedbacks]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setLoading(false);
    }
  };

  const handleEditClick = (feedback) => {
    setEditedFeedback(feedback);
    setEditableFeedbackId(feedback._id);
  };

  const handleSave = async () => {
    if (editedFeedback.nominatedForBestTA && !editedFeedback.comments) {
      alert('Please provide a comment if you nominate a student for Best TA.');
      return;
    }
    try {
      await axios.put(`${API}/api/feedback/${editableFeedbackId}`, editedFeedback);
      setEditableFeedbackId(null);
      // Option 1: re-fetch from page 1 (resetting list)
      setPage(1);
      setFeedbacks([]);
      fetchFeedbacks(1);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleCancel = () => {
    setEditableFeedbackId(null);
    setEditedFeedback({});
  };

  const handleChange = (e, key) => {
    setEditedFeedback((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API}/api/feedback/download`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to download feedbacks');
      }
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'feedbacks.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading feedbacks:', error);
      alert('Error downloading feedbacks');
    }
  };

  const headers = [
    "Student Roll No.",
    "Student Name",
    "Course",
    "Overall Grade",
    "Regularity",
    "Attendance",
    "Tutorial Prep",
    "Timeliness",
    "Quality of Work",
    "Commitment",
    "Best TA",
    "Comments",
  ];

  const renderHeaderRow = () => {
    return (
      <tr className="bg-[#3dafaa] text-white">
        {headers.map((header, index) => (
          <th key={index} className="border-b py-3 px-4 text-center font-semibold">
            {header}
          </th>
        ))}
        {user?.role === 'professor' && (
          <th className="border-b py-3 px-4 text-center font-semibold">Actions</th>
        )}
      </tr>
    );
  };

  const sortFeedbacksByTimestamp = (feedbacks) => {
    // Create a copy to avoid mutating state directly.
    return [...feedbacks].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // If you want to sort the accumulated feedbacks, you can call this function.
  const sortedFeedbacks = sortFeedbacksByTimestamp(feedbacks);

  const renderFeedbackRow = (feedback, index) => (
    <tr className="text-center" key={index}>
      <td className="border-b py-2 px-3">{feedback.student ? feedback.student.rollNo : "N/A"}</td>
      <td className="border-b py-2 px-3">{feedback.student ? feedback.student.name : "N/A"}</td>
      <td className="border-b py-2 px-3">{feedback.course ? feedback.course.name : "N/A"}</td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.overallGrade || ''}
            onChange={(e) => handleChange(e, 'overallGrade')}
          >
            <option value="S">S</option>
            <option value="X">X</option>
          </select>
        ) : (
          feedback.overallGrade
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.regularityInMeeting || ''}
            onChange={(e) => handleChange(e, 'regularityInMeeting')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.regularityInMeeting
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.attendanceInLectures || ''}
            onChange={(e) => handleChange(e, 'attendanceInLectures')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.attendanceInLectures
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.preparednessForTutorials || ''}
            onChange={(e) => handleChange(e, 'preparednessForTutorials')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.preparednessForTutorials
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.timelinessOfTasks || ''}
            onChange={(e) => handleChange(e, 'timelinessOfTasks')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.timelinessOfTasks
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.qualityOfWork || ''}
            onChange={(e) => handleChange(e, 'qualityOfWork')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.qualityOfWork
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.attitudeCommitment || ''}
            onChange={(e) => handleChange(e, 'attitudeCommitment')}
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : (
          feedback.attitudeCommitment
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.nominatedForBestTA || false}
            onChange={(e) => handleChange(e, 'nominatedForBestTA')}
          >
            <option value={false}>No</option>
            <option value={true}>Yes</option>
          </select>
        ) : (
          feedback.nominatedForBestTA ? 'Yes' : 'No'
        )}
      </td>
      <td className="border-b py-2 px-3">
        {editableFeedbackId === feedback._id ? (
          <input
            type="text"
            value={editedFeedback.comments || ''}
            onChange={(e) => handleChange(e, 'comments')}
            className="border rounded px-2 py-1 w-full text-sm"
          />
        ) : (
          feedback.comments || 'N/A'
        )}
      </td>
      {user?.role === 'professor' && (
        <td className="border-b py-2 px-3">
          {editableFeedbackId === feedback._id ? (
            <div className="flex space-x-2">
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
              onClick={() => handleEditClick(feedback)}
            >
              Edit
            </button>
          )}
        </td>
      )}
    </tr>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex w-full justify-end mb-4">
        {user?.role === 'admin' && (
          <button
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white font-bold px-2 py-1 rounded-full text-sm"
            onClick={handleDownload}
          >
            Download
          </button>
        )}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-auto"
          style={{ maxHeight: 'calc(100vh - 150px)' }}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            // If scrolled within 50px of bottom and there are more pages…
            if (scrollHeight - scrollTop <= clientHeight + 50 && feedbacks.length < total) {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchFeedbacks(nextPage);
            }
          }}
        >
          <div className="shadow-2xl rounded-3xl overflow-hidden border">
            <table className="min-w-full table-fixed border-collapse">
              <thead className="sticky top-0">{renderHeaderRow()}</thead>
              <tbody>
                {sortedFeedbacks.map((feedback, index) =>
                  renderFeedbackRow(feedback, index)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
