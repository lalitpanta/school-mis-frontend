import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ResultPage = () => {
  const { user, isStaff } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // If teacher, fetch only their classrooms
        if (user?.type === 'staff') {
          const res = await api.get('/v1/results/teacher/classrooms');
          setClassrooms(res.data.data || []);
        } else {
          // admin/tenant: fetch all classrooms
          const res = await api.get('/v1/classrooms');
          setClassrooms(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load classrooms', err);
      }
    };
    load();
  }, [user]);

  const loadResults = async (classroomId) => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/results/classroom/${classroomId}`);
      setResults(res.data.data || []);
      setSelectedClassroom(classroomId);
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Results Management</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Classroom</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          onChange={(e) => loadResults(e.target.value)}
          value={selectedClassroom || ''}
        >
          <option value="">-- Select Classroom --</option>
          {classrooms.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? <p>Loading results...</p> : (
        <div>
          {results.length === 0 ? <p>No results found for this classroom.</p> : (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Subject</th>
                  <th>First Term</th>
                  <th>Second Term</th>
                  <th>Final</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>{r.student_id}</td>
                    <td>{r.subject}</td>
                    <td>{r.first_term_marks}</td>
                    <td>{r.second_term_marks}</td>
                    <td>{r.final_marks}</td>
                    <td>{r.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultPage;
