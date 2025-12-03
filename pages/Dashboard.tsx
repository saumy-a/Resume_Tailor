import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { tailorResume, generateAnswers, extractJobDetails } from '../services/geminiService';
import { saveResume, saveAnswer, getScriptUrl } from '../services/sheetService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'answers'>('resume');
  const [baseResume, setBaseResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState('');
  
  const [tailoredResume, setTailoredResume] = useState('');
  const [generatedAnswers, setGeneratedAnswers] = useState<Array<{question: string, answer: string}>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSheetConnected = !!getScriptUrl();

  const handleDownload = () => {
    if (activeTab === 'resume' && tailoredResume) {
      const blob = new Blob([tailoredResume], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tailored_resume_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (activeTab === 'answers' && generatedAnswers.length > 0) {
      const text = generatedAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}\n`).join('\n---\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `answers_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAction = async () => {
    if (!baseResume || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }
    if (activeTab === 'answers' && !questions) {
      setError("Please provide questions.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      if (activeTab === 'resume') {
        const details = await extractJobDetails(jobDescription);
        const result = await tailorResume(baseResume, jobDescription, user.model_choice);
        setTailoredResume(result);

        const jobId = `job_${Date.now()}`;
        await saveResume({
          resume_id: `res_${Date.now()}`,
          user_id: user.user_id,
          job_id: jobId,
          original_resume_content: baseResume,
          updated_resume_content: result,
          company_name: details.company,
          job_title: details.title,
          date: new Date().toISOString()
        });
      } else {
        const qList = questions.split('\n').filter(q => q.trim().length > 0);
        const results = await generateAnswers(qList, baseResume, jobDescription, user.model_choice);
        setGeneratedAnswers(results);

        const jobId = `job_${Date.now()}`;
        for (const item of results) {
          await saveAnswer({
            answer_id: `ans_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            user_id: user.user_id,
            job_id: jobId,
            question_text: item.question,
            answer_text: item.answer,
            date: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      setError("Failed to process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 min-h-[calc(100vh-8rem)]">
      
      {/* Left Column: Workspace */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Connection Warning */}
        {!isSheetConnected && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start shadow-sm">
            <span className="material-symbols-outlined text-orange-500 mr-3">cloud_off</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Database Disconnected</p>
              <p className="text-sm text-orange-700 mt-1">
                Your history won't be saved to Google Sheets. 
                <Link to="/profile" className="underline ml-1 font-bold hover:text-orange-900">Connect Now</Link>
              </p>
            </div>
          </div>
        )}

        {/* Input Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
             <button
                onClick={() => setActiveTab('resume')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'resume' 
                  ? 'border-indigo-500 text-indigo-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
             >
                <span className="material-symbols-outlined text-lg">description</span>
                <span>Tailor Resume</span>
             </button>
             <button
                onClick={() => setActiveTab('answers')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'answers' 
                  ? 'border-indigo-500 text-indigo-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
             >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>Generate Answers</span>
             </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Base Resume</label>
              <div className="relative">
                <textarea
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 min-h-[120px]"
                  placeholder="Paste your full resume here..."
                  value={baseResume}
                  onChange={(e) => setBaseResume(e.target.value)}
                />
                <div className="absolute top-3 right-3 text-gray-400 pointer-events-none">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Description</label>
              <div className="relative">
                <textarea
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 min-h-[120px]"
                  placeholder="Paste the Job Description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="absolute top-3 right-3 text-gray-400 pointer-events-none">
                  <span className="material-symbols-outlined text-lg">work</span>
                </div>
              </div>
            </div>

            {activeTab === 'answers' && (
              <div className="animate-fade-in-down">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Questions</label>
                <textarea
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 min-h-[100px]"
                  placeholder="Paste questions here (one per line)..."
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                />
              </div>
            )}
            
            {error && (
               <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center">
                  <span className="material-symbols-outlined text-lg mr-2">error</span>
                  {error}
               </div>
            )}

            <button
              onClick={handleAction}
              disabled={isProcessing}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
            >
               {isProcessing ? (
                 <>
                   <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                   Processing with {user.model_choice}...
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined text-lg mr-2">auto_awesome</span>
                   {activeTab === 'resume' ? 'Tailor Resume' : 'Generate Answers'}
                 </>
               )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Output Editor */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="flex-grow bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">
          
          {/* Editor Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            </div>
            <div className="text-xs font-mono text-slate-400">
               {activeTab === 'resume' ? 'resume-output.md' : 'answers.txt'}
            </div>
            <div>
               {(tailoredResume || generatedAnswers.length > 0) && (
                 <button 
                    onClick={handleDownload}
                    className="text-xs flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
                 >
                   <span className="material-symbols-outlined text-sm mr-1">download</span>
                   Save
                 </button>
               )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-grow p-4 overflow-y-auto font-mono text-sm leading-relaxed custom-scrollbar bg-slate-900 text-slate-300">
             
             {/* Loading State */}
             {isProcessing && (
                <div className="space-y-4 animate-pulse pt-8 px-4">
                   <div className="flex gap-4">
                      <div className="w-8 text-right text-slate-700">1</div>
                      <div className="h-2 bg-slate-700 rounded w-1/3"></div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-8 text-right text-slate-700">2</div>
                      <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-8 text-right text-slate-700">3</div>
                      <div className="h-2 bg-slate-700 rounded w-2/3"></div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-8 text-right text-slate-700">4</div>
                      <div className="h-2 bg-slate-700 rounded w-1/4"></div>
                   </div>
                   <div className="mt-8 text-center text-indigo-400 text-xs tracking-widest uppercase">
                      AI is thinking...
                   </div>
                </div>
             )}

             {/* Resume Output */}
             {!isProcessing && activeTab === 'resume' && tailoredResume && (
                <div className="whitespace-pre-wrap selection:bg-indigo-500/30 selection:text-white">
                  {tailoredResume}
                </div>
             )}

             {/* Answers Output */}
             {!isProcessing && activeTab === 'answers' && generatedAnswers.length > 0 && (
               <div className="space-y-6">
                 {generatedAnswers.map((item, idx) => (
                   <div key={idx} className="group">
                     <div className="text-slate-500 mb-1 flex items-center">
                        <span className="text-indigo-500 mr-2">Q{idx+1}:</span> {item.question}
                     </div>
                     <div className="pl-6 border-l-2 border-slate-700 text-slate-200 group-hover:border-indigo-500 transition-colors">
                        {item.answer}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* Empty State */}
             {!isProcessing && !tailoredResume && generatedAnswers.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                   <span className="material-symbols-outlined text-5xl mb-3">terminal</span>
                   <p className="text-sm">Output will appear here</p>
                </div>
             )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;