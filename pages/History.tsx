import React, { useEffect, useState } from 'react';
import { User, ResumeEntry, AnswerEntry } from '../types';
import { getHistory } from '../services/sheetService';

interface HistoryProps {
  user: User;
}

const History: React.FC<HistoryProps> = ({ user }) => {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getHistory(user.user_id);
      setResumes(data.resumes);
      setAnswers(data.answers);
      setLoading(false);
    };
    fetchData();
  }, [user.user_id]);

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tailored Resumes</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {resumes.length === 0 ? <li className="p-4 text-gray-500">No history found.</li> : resumes.map((resume) => (
              <li key={resume.resume_id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{resume.company_name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {resume.job_title}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Generated on <time dateTime={resume.date}>{new Date(resume.date).toLocaleDateString()}</time>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Answers</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {answers.length === 0 ? <li className="p-4 text-gray-500">No history found.</li> : answers.map((ans) => (
              <li key={ans.answer_id} className="px-4 py-4 sm:px-6">
                 <div className="mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Question</span>
                    <p className="text-sm text-gray-900 font-medium">{ans.question_text}</p>
                 </div>
                 <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Generated Answer</span>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{ans.answer_text}</p>
                 </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default History;