import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';

const FeedbackList = () => {
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editableFeedbackId, setEditableFeedbackId] = useState(null);
  const [editedFeedback, setEditedFeedback] = useState({});

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchFeedbacks();
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      let response;
  
      if (user && user.role === 'professor') {
        // Fetch feedbacks related to the professor's courses
        response = await axios.get(`${API}/api/feedback/professor/${user.id}`);
        const assignedFeedbacks = response?.data.feedbacks || [];
  
        // Filter duplicate entries for the same student
        const uniqueFeedbacks = assignedFeedbacks.reduce((acc, feedback) => {
          if (!acc.find(f => f.student._id === feedback.student._id)) {
            acc.push(feedback);
          }
          return acc;
        }, []);
        setFeedbacks(uniqueFeedbacks);
      } else if (user && user.role === 'admin') {
        // Fetch all feedbacks for the admin
        response = await axios.get(`${API}/api/feedback/all`);
        const allFeedbacks = response?.data.feedbacks || [];
        setFeedbacks(allFeedbacks); // No filtering applied
      }
  
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
      fetchFeedbacks();
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

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Feedback List</h2>
      {user?.role === 'admin' && (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={handleDownload}
        >
          Download Feedbacks
        </button>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-auto max-w-[80vw] max-h-[60vh]">
          <table className="table-auto border-collapse border ">
            <thead>
              <tr className="bg-gray-200 sticky top-0 w-full">
                <th className="border p-2">Student Roll No.</th>
                <th className="border p-2">Student Name</th>
                <th className="border p-2">Course</th>
                <th className="border p-2">Overall Grade</th>
                <th className="border p-2">Regularity</th>
                <th className="border p-2">Attendance</th>
                <th className="border p-2">Tutorial Prep</th>
                <th className="border p-2">Timeliness</th>
                <th className="border p-2">Quality of Work</th>
                <th className="border p-2">Commitment</th>
                <th className="border p-2">Best TA</th>
                <th className="border px-20 w-60">Comments</th>
                {user?.role === 'professor' && <th className="border p-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center p-4">No feedbacks available.</td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback._id}>
                 
                    <td className="border p-2">{feedback.student?.rollNo}</td>
                    <td className="border p-2">{feedback.student?.name}</td>
                    <td className="border p-2">{feedback.course?.name}</td>
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2">
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
                    <td className="border p-2 w-1000">
                      {editableFeedbackId === feedback._id ? (
                        <input
                          type="text"
                          value={editedFeedback.comments || ''}
                          onChange={(e) => handleChange(e, 'comments')}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        feedback.comments || 'N/A'
                      )}
                    </td>
                    {user?.role === 'professor' && (
                      <td className="border p-2">
                        {editableFeedbackId === feedback._id ? (
                          <div className="flex space-x-2">
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded"
                              onClick={handleSave}
                            >
                              Save
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                            onClick={() => handleEditClick(feedback)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;

