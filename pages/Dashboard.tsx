import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, ResumeInput } from '../types';
import { tailorResume, generateAnswers, extractJobDetails } from '../services/geminiService';
import { saveResume, saveAnswer, getScriptUrl } from '../services/sheetService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'answers'>('resume');
  
  // Resume Input State
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [baseResumeText, setBaseResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<{name: string, base64: string} | null>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState('');
  
  const [tailoredResume, setTailoredResume] = useState('');
  const [generatedAnswers, setGeneratedAnswers] = useState<Array<{question: string, answer: string}>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSheetConnected = !!getScriptUrl();

  // Robust Markdown to HTML parser for PDF generation
  const markdownToHtml = (markdown: string): string => {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();
        // Check for list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                html += '<ul style="padding-left: 20px; margin-bottom: 10px;">';
                inList = true;
            }
            const content = trimmed.substring(2)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            html += `<li style="margin-bottom: 4px;">${content}</li>`;
        } else {
            // Close list if we were in one
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            
            // Process headers and paragraphs
            if (trimmed.startsWith('# ')) {
                html += `<h1 style="font-size: 24px; font-weight: bold; border-bottom: 2px solid #333; margin-top: 24px; margin-bottom: 12px; padding-bottom: 4px; color: #111;">${trimmed.substring(2)}</h1>`;
            } else if (trimmed.startsWith('## ')) {
                html += `<h2 style="font-size: 18px; font-weight: bold; margin-top: 18px; margin-bottom: 8px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">${trimmed.substring(3)}</h2>`;
            } else if (trimmed.startsWith('### ')) {
                html += `<h3 style="font-size: 16px; font-weight: bold; margin-top: 12px; margin-bottom: 6px; color: #444;">${trimmed.substring(4)}</h3>`;
            } else if (trimmed.length > 0) {
                 const content = trimmed
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                html += `<p style="margin-bottom: 8px; line-height: 1.5;">${content}</p>`;
            }
        }
    });
    
    if (inList) html += '</ul>';
    return html;
  };

  const handleExportPdf = () => {
    if (activeTab === 'resume' && tailoredResume) {
      const htmlContent = markdownToHtml(tailoredResume);
      // Open a new window for printing
      const printWindow = window.open('', '_blank', 'height=800,width=900');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Resume - ${user.name}</title>
              <style>
                body {
                  font-family: 'Georgia', 'Times New Roman', serif;
                  line-height: 1.5;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 40px;
                  background: white;
                }
                h1, h2, h3 { color: #000; font-family: 'Arial', sans-serif; }
                p { margin: 0 0 10px 0; }
                ul { margin: 0 0 10px 0; }
                li { margin-bottom: 2px; }
                
                @media print {
                  body { 
                    padding: 0; 
                    max-width: 100%;
                  }
                  @page { 
                    margin: 1.5cm; 
                    size: auto;
                  }
                }
              </style>
            </head>
            <body>
              ${htmlContent}
              <script>
                // Wait for content to load then print
                window.onload = function() { 
                  setTimeout(function() {
                    window.print();
                    // window.close(); // Optional: close after print
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close(); // Necessary for IE >= 10
        printWindow.focus(); // Necessary for IE >= 10
      }
    } else {
      alert("Only resumes can be exported to PDF currently.");
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        // Extract base64 part (remove "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        setResumeFile({ name: file.name, base64: base64 });
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    // Validation
    const hasResume = inputType === 'text' ? !!baseResumeText : !!resumeFile;
    if (!hasResume || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }
    if (activeTab === 'answers' && !questions) {
      setError("Please provide questions.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    const resumeInput: ResumeInput = inputType === 'file' && resumeFile 
      ? { type: 'file', content: resumeFile.base64, mimeType: 'application/pdf', fileName: resumeFile.name }
      : { type: 'text', content: baseResumeText };

    try {
      if (activeTab === 'resume') {
        const details = await extractJobDetails(jobDescription);
        const result = await tailorResume(resumeInput, jobDescription, user.model_choice);
        setTailoredResume(result);

        // Store history (For file uploads, we save a placeholder string in DB for now as saving entire PDF base64 might hit cell limits)
        const storedOriginalContent = inputType === 'file' 
           ? `[PDF File Uploaded: ${resumeFile?.name}]` 
           : baseResumeText;

        const jobId = `job_${Date.now()}`;
        await saveResume({
          resume_id: `res_${Date.now()}`,
          user_id: user.user_id,
          job_id: jobId,
          original_resume_content: storedOriginalContent,
          updated_resume_content: result,
          company_name: details.company,
          job_title: details.title,
          date: new Date().toISOString()
        });
      } else {
        const qList = questions.split('\n').filter(q => q.trim().length > 0);
        const results = await generateAnswers(qList, resumeInput, jobDescription, user.model_choice);
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Resume</label>
                
                {/* Switcher Text/PDF */}
                <div className="bg-gray-100 p-1 rounded-lg flex text-xs">
                   <button 
                     onClick={() => setInputType('text')}
                     className={`px-3 py-1 rounded-md transition-all ${inputType === 'text' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     Text
                   </button>
                   <button 
                     onClick={() => setInputType('file')}
                     className={`px-3 py-1 rounded-md transition-all ${inputType === 'file' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     PDF Upload
                   </button>
                </div>
              </div>

              {inputType === 'text' ? (
                <div className="relative">
                  <textarea
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 min-h-[120px]"
                    placeholder="Paste your full resume here..."
                    value={baseResumeText}
                    onChange={(e) => setBaseResumeText(e.target.value)}
                  />
                  <div className="absolute top-3 right-3 text-gray-400 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                        >
                          <span>Upload a PDF</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 5MB</p>
                      {resumeFile && (
                        <div className="flex items-center justify-center text-green-600 text-sm font-medium mt-2">
                          <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                          {resumeFile.name}
                        </div>
                      )}
                    </div>
                </div>
              )}
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
            <div className="flex space-x-3">
               {(tailoredResume && activeTab === 'resume') && (
                  <button 
                    onClick={handleExportPdf}
                    className="text-xs flex items-center text-red-400 hover:text-red-300 transition-colors"
                    title="Export as PDF"
                 >
                   <span className="material-symbols-outlined text-sm mr-1">picture_as_pdf</span>
                   PDF
                 </button>
               )}
               {(tailoredResume || generatedAnswers.length > 0) && (
                 <button 
                    onClick={handleDownload}
                    className="text-xs flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
                    title={activeTab === 'resume' ? "Download as Markdown" : "Download as Text"}
                 >
                   <span className="material-symbols-outlined text-sm mr-1">download</span>
                   Save {activeTab === 'resume' ? '.md' : '.txt'}
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