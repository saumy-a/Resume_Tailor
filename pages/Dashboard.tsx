import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, ResumeInput, ResumeEntry } from '../types';
import { tailorResume, generateAnswers, extractJobDetails } from '../services/geminiService';
import { saveResume, saveAnswer, getScriptUrl } from '../services/sheetService';

interface DashboardProps {
  user: User;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

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
  
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  
  // UI States
  const [viewMode, setViewMode] = useState<'terminal' | 'preview'>('preview');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSheetConnected = !!getScriptUrl();

  // --- HELPERS ---

  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    
    // Clean up generic markdown code blocks if AI adds them
    let cleanMd = markdown.replace(/```markdown/g, '').replace(/```/g, '').trim();

    const lines = cleanMd.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();
        
        if (!trimmed) {
             if (inList) { html += '</ul>'; inList = false; }
             return;
        }

        // Header 1 (Name)
        if (trimmed.startsWith('# ')) {
             if (inList) { html += '</ul>'; inList = false; }
             html += `<h1 class="text-3xl font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-900 pb-2 mb-4 mt-2">${trimmed.substring(2)}</h1>`;
        } 
        // Header 2 (Sections)
        else if (trimmed.startsWith('## ')) {
             if (inList) { html += '</ul>'; inList = false; }
             html += `<h2 class="text-lg font-bold text-indigo-900 uppercase tracking-wider border-b border-gray-300 pb-1 mt-6 mb-3">${trimmed.substring(3)}</h2>`;
        } 
        // Header 3 (Sub-sections/Jobs)
        else if (trimmed.startsWith('### ')) {
             if (inList) { html += '</ul>'; inList = false; }
             html += `<h3 class="text-md font-bold text-gray-800 mt-4 mb-1">${trimmed.substring(4)}</h3>`;
        } 
        // Bullet Points
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                html += '<ul class="list-disc pl-5 space-y-1 mb-2 text-gray-700">';
                inList = true;
            }
            const content = trimmed.substring(2)
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-gray-800">$1</em>');
            html += `<li class="leading-relaxed">${content}</li>`;
        } 
        // Standard Paragraphs
        else {
            if (inList) { html += '</ul>'; inList = false; }
            const content = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-gray-800">$1</em>');
            
            // Heuristic: If line contains a pipe | or looks like contact info, center it
            if (trimmed.includes('|') || trimmed.includes('@')) {
                html += `<p class="text-sm text-gray-600 text-center mb-4">${content}</p>`;
            } else {
                html += `<p class="mb-2 leading-relaxed text-gray-700 text-justify">${content}</p>`;
            }
        }
    });
    
    if (inList) html += '</ul>';
    return html;
  };

  // --- ACTIONS ---

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('File size too large. Please upload a PDF smaller than 3MB.');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        const base64 = result.split(',')[1];
        setResumeFile({ name: file.name, base64: base64 });
        setInputType('file'); // Auto switch tab
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsDataURL(file);
  };

  const handleExportPdf = () => {
    if (activeTab === 'resume' && tailoredResume) {
      const htmlContent = markdownToHtml(tailoredResume);
      const printWindow = window.open('', '_blank', 'height=800,width=900');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${user.name} - Resume</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Open+Sans:wght@400;600;700&display=swap');
                body {
                  font-family: 'Merriweather', serif; /* Professional Serif font */
                  font-size: 10pt;
                  color: #111;
                  background: white;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                h1, h2, h3, h4 { font-family: 'Open Sans', sans-serif; }
                p { margin-bottom: 6px; }
                ul { margin-bottom: 8px; }
                li { margin-bottom: 2px; }
                
                @media print {
                  body { padding: 0; margin: 0; max-width: 100%; }
                  @page { margin: 1.2cm; size: auto; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${htmlContent}
              <script>
                window.onload = function() { 
                  setTimeout(function() { window.print(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close(); 
        printWindow.focus(); 
      }
    }
  };

  const handleDownload = () => {
    if (activeTab === 'resume' && tailoredResume) {
      const blob = new Blob([tailoredResume], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume_${user.name.replace(/\s+/g,'_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (activeTab === 'answers' && generatedAnswers.length > 0) {
      const text = generatedAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}\n`).join('\n---\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Answers_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAction = async () => {
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
    setPermissionError(false);
    setIsProcessing(true);
    setStatusMessage(`Initializing ${user.model_choice}...`);

    // Switch to preview mode automatically on generate
    if (activeTab === 'resume') setViewMode('preview');

    const resumeInput: ResumeInput = inputType === 'file' && resumeFile 
      ? { type: 'file', content: resumeFile.base64, mimeType: 'application/pdf', fileName: resumeFile.name }
      : { type: 'text', content: baseResumeText };

    try {
      if (activeTab === 'resume') {
        setStatusMessage("Parsing Job Description...");
        const details = await extractJobDetails(jobDescription);
        
        setStatusMessage("Optimizing Resume Structure...");
        const result = await tailorResume(resumeInput, jobDescription, user.model_choice);
        setTailoredResume(result);

        // Payload preparation
        const resumePayload: ResumeEntry = {
          resume_id: `res_${Date.now()}`,
          user_id: user.user_id,
          job_id: `job_${Date.now()}`,
          original_resume_link: inputType === 'file' ? `[File: ${resumeFile?.name}]` : baseResumeText.substring(0, 50) + '...', 
          updated_resume_content: result,
          company_name: details.company,
          job_title: details.title,
          date: new Date().toISOString()
        };

        const fileData = (inputType === 'file' && resumeFile) ? {
          base64: resumeFile.base64,
          mimeType: 'application/pdf',
          name: resumeFile.name
        } : undefined;

        if (fileData) setStatusMessage("Syncing PDF to Google Drive...");
        else setStatusMessage("Saving to Database...");

        const saveResponse = await saveResume(resumePayload, fileData);
        
        if (saveResponse?.status === 'error') {
           if (saveResponse.message.includes("DriveApp")) {
              setPermissionError(true);
           } else {
              setError(`Saved with error: ${saveResponse.message}`);
           }
        } else {
           if (inputType === 'file') setResumeFile(null); // Reset file input on success
        }

      } else {
        const qList = questions.split('\n').filter(q => q.trim().length > 0);
        setStatusMessage("Thinking...");
        const results = await generateAnswers(qList, resumeInput, jobDescription, user.model_choice);
        setGeneratedAnswers(results);

        // Save Answers Logic (Simplified loop)
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
    } catch (e: any) {
      setError(e.message || "Failed to process.");
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 min-h-[calc(100vh-8rem)]">
      
      {/* --- LEFT COLUMN: INPUTS --- */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-6">
        
        {/* Alerts */}
        {!isSheetConnected && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
            <div className="flex">
              <span className="material-symbols-outlined text-orange-400 mr-2">warning</span>
              <p className="text-sm text-orange-700">
                Database disconnected. <Link to="/profile" className="font-bold underline">Fix Connection</Link>
              </p>
            </div>
          </div>
        )}

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200">
             <button
                onClick={() => setActiveTab('resume')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${
                  activeTab === 'resume' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
             >
                <span className="material-symbols-outlined">description</span>
                <span>Resume</span>
             </button>
             <button
                onClick={() => setActiveTab('answers')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${
                  activeTab === 'answers' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
             >
                <span className="material-symbols-outlined">forum</span>
                <span>Answers</span>
             </button>
          </div>

          <div className="p-6 space-y-5">
            {/* 1. Resume Input */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source Resume</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                   <button 
                     onClick={() => setInputType('text')}
                     className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputType === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                   >Text</button>
                   <button 
                     onClick={() => setInputType('file')}
                     className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputType === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                   >PDF</button>
                </div>
              </div>

              {inputType === 'text' ? (
                <textarea
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-4 min-h-[140px] bg-gray-50"
                  placeholder="Paste your current resume content here..."
                  value={baseResumeText}
                  onChange={(e) => setBaseResumeText(e.target.value)}
                />
              ) : (
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer 
                    ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 hover:bg-gray-50'}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={(e) => e.target.files && processFile(e.target.files[0])} 
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <span className={`material-symbols-outlined text-4xl mb-2 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {isDragging ? 'file_download' : 'cloud_upload'}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {resumeFile ? 'Change File' : 'Click or Drag PDF here'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Up to 3MB</p>
                    
                    {resumeFile && (
                      <div className="mt-3 flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        <span className="material-symbols-outlined text-sm mr-1">check</span>
                        {resumeFile.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Job Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Job Description</label>
              <textarea
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-4 min-h-[140px] bg-gray-50"
                placeholder="Paste the JD here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* 3. Questions (Conditional) */}
            {activeTab === 'answers' && (
              <div className="animate-fade-in-down">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Application Questions</label>
                <textarea
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-4 min-h-[100px] bg-gray-50"
                  placeholder="e.g. Why do you want to work here?"
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                />
              </div>
            )}
            
            {/* Errors */}
            {error && (
               <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                  <span className="material-symbols-outlined mr-2">error</span>
                  {error}
               </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleAction}
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 font-bold transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:scale-100 flex items-center justify-center"
            >
               {isProcessing ? (
                 <>
                   <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                   {statusMessage || 'Processing...'}
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined mr-2">magic_button</span>
                   {activeTab === 'resume' ? 'Tailor Resume Now' : 'Generate Answers'}
                 </>
               )}
            </button>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: OUTPUT --- */}
      <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-full min-h-[600px]">
        
        {/* Output Container */}
        <div className="flex-grow bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden relative">
          
          {/* Header Bar */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700 z-10">
            {/* View Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-0.5">
               <button 
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${viewMode === 'preview' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 <span className="material-symbols-outlined text-sm mr-1">article</span> Preview
               </button>
               <button 
                  onClick={() => setViewMode('terminal')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${viewMode === 'terminal' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 <span className="material-symbols-outlined text-sm mr-1">terminal</span> Code
               </button>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
               {(tailoredResume && activeTab === 'resume') && (
                  <button 
                    onClick={handleExportPdf}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs font-bold flex items-center transition-colors"
                 >
                   <span className="material-symbols-outlined text-sm mr-1">picture_as_pdf</span>
                   Export PDF
                 </button>
               )}
               {(tailoredResume || generatedAnswers.length > 0) && (
                 <button 
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md text-xs font-bold flex items-center transition-colors"
                 >
                   <span className="material-symbols-outlined text-sm mr-1">download</span>
                   Download
                 </button>
               )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-grow relative overflow-hidden bg-slate-900/50">
             
             {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
                   <div className="loader mb-4"></div>
                   <p className="text-indigo-400 font-mono animate-pulse">{statusMessage}</p>
                </div>
             )}

             {/* PREVIEW MODE (Paper View) */}
             {viewMode === 'preview' && activeTab === 'resume' && (
                <div className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar bg-slate-100 flex justify-center">
                   {tailoredResume ? (
                      <div 
                        className="bg-white text-gray-900 shadow-xl p-[40px] max-w-[800px] w-full min-h-[1000px]"
                        style={{ fontFamily: "'Merriweather', 'Times New Roman', serif" }} // Formal Font
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(tailoredResume) }}
                      />
                   ) : (
                      <EmptyState />
                   )}
                </div>
             )}

             {/* TERMINAL MODE (Raw Code) */}
             {(viewMode === 'terminal' || activeTab === 'answers') && (
               <div className="absolute inset-0 overflow-y-auto p-6 font-mono text-sm leading-relaxed custom-scrollbar bg-slate-900 text-slate-300">
                  {tailoredResume && activeTab === 'resume' ? (
                     <pre className="whitespace-pre-wrap">{tailoredResume}</pre>
                  ) : generatedAnswers.length > 0 && activeTab === 'answers' ? (
                     <div className="space-y-6">
                       {generatedAnswers.map((item, idx) => (
                         <div key={idx} className="group">
                           <div className="text-slate-500 mb-2 flex items-center font-bold">
                              <span className="text-indigo-400 mr-2">Q{idx+1}:</span> {item.question}
                           </div>
                           <div className="pl-4 border-l-2 border-slate-700 text-slate-200 group-hover:border-indigo-500 transition-colors">
                              {item.answer}
                           </div>
                         </div>
                       ))}
                     </div>
                  ) : (
                     <EmptyState />
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Permission Error Modal/Banner */}
      {permissionError && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-red-600 flex items-center mb-4">
                 <span className="material-symbols-outlined mr-2">lock_person</span> Permission Required
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                 Your Google Script cannot save the PDF file because it lacks "Create Folder" permissions.
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-800 space-y-2 mb-6">
                 <li>Go to <strong>script.google.com</strong></li>
                 <li>Run the <code>setup()</code> function manually</li>
                 <li>Accept the permissions popup</li>
                 <li className="font-bold text-indigo-600">Deploy New Version</li>
              </ol>
              <button 
                onClick={() => setPermissionError(false)}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-bold"
              >
                Close
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
      <span className="material-symbols-outlined text-6xl mb-4">description</span>
      <p className="text-base font-medium">Ready to Generate</p>
      <p className="text-xs mt-2">Upload a resume and click Tailor</p>
  </div>
);

export default Dashboard;
