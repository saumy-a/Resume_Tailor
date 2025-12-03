import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="bg-white font-sans selection:bg-indigo-100">
      
      {/* Hero Section */}
      <div className="relative bg-slate-900 pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover opacity-10"
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
            alt="Office background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 mix-blend-multiply" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center text-white bg-indigo-800/50 rounded-full p-1 pr-4 sm:text-base lg:text-sm xl:text-base border border-indigo-500/30 backdrop-blur-sm mb-6">
                <span className="px-3 py-0.5 text-white text-xs font-semibold leading-5 uppercase tracking-wide bg-indigo-500 rounded-full">New</span>
                <span className="ml-4 text-sm">Powered by Gemini 2.5 Flash</span>
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">Tailor your resume</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">
                  in seconds, not hours.
                </span>
              </h1>
              <p className="mt-4 max-w-lg mx-auto text-lg text-indigo-200 sm:max-w-3xl lg:mx-0">
                Stop generic applications. Our AI analyzes job descriptions and rewrites your resume to pass ATS filters and impress recruiters instantly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600/30 hover:bg-indigo-600/50 backdrop-blur-md transition-all border-indigo-400/30"
                >
                  View Demo
                </Link>
              </div>
            </div>
            
            {/* Visual Element / Mockup */}
            <div className="mt-12 lg:mt-0 relative">
               <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-sm transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                    <div className="flex items-center px-4 py-3 bg-slate-800 border-b border-slate-700 space-x-2">
                       <div className="w-3 h-3 rounded-full bg-red-500"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                       <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="p-6 font-mono text-sm text-gray-300 space-y-4">
                       <div className="flex gap-4">
                          <span className="text-indigo-400">$</span>
                          <span className="typing-effect">Analyzing Job Description...</span>
                       </div>
                       <div className="flex gap-4">
                          <span className="text-green-400">✔</span>
                          <span>Keywords Extracted: "React", "TypeScript", "SaaS"</span>
                       </div>
                       <div className="flex gap-4">
                          <span className="text-indigo-400">$</span>
                          <span>Generating ATS-Optimized Resume...</span>
                       </div>
                       <div className="p-3 bg-indigo-900/20 border-l-2 border-indigo-500 text-indigo-200 text-xs">
                          "Experienced Senior Engineer with a proven track record in building scalable SaaS architectures using React and Google Cloud..."
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to get hired
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
               {/* Feature 1 */}
               <div className="pt-6">
                 <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm h-full hover:shadow-md transition-shadow border border-gray-100">
                   <div className="-mt-6">
                     <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                       <span className="material-symbols-outlined text-white">auto_fix_high</span>
                     </div>
                     <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Smart Tailoring</h3>
                     <p className="mt-5 text-base text-gray-500">
                       Our AI reads the JD line-by-line and adjusts your resume to highlight the exact skills recruiters are looking for.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Feature 2 */}
               <div className="pt-6">
                 <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm h-full hover:shadow-md transition-shadow border border-gray-100">
                   <div className="-mt-6">
                     <div className="inline-flex items-center justify-center p-3 bg-purple-500 rounded-md shadow-lg">
                       <span className="material-symbols-outlined text-white">quiz</span>
                     </div>
                     <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Answer Generator</h3>
                     <p className="mt-5 text-base text-gray-500">
                       Stuck on "Why do you want to work here?" We generate perfect, personalized answers for application forms.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Feature 3 */}
               <div className="pt-6">
                 <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm h-full hover:shadow-md transition-shadow border border-gray-100">
                   <div className="-mt-6">
                     <div className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                       <span className="material-symbols-outlined text-white">table_view</span>
                     </div>
                     <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Google Sheets Sync</h3>
                     <p className="mt-5 text-base text-gray-500">
                       Keep your own database. Every resume and answer is automatically logged to your private Google Sheet.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Choose the plan that fits your job search needs.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto grid gap-6 lg:grid-cols-2 lg:max-w-none">
             {/* Free Tier */}
             <div className="flex flex-col rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors">
                <div className="p-8 pb-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">$0</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                  </p>
                  <p className="mt-6 text-gray-500">Perfect for casual job seekers.</p>
                  <ul className="mt-6 space-y-4">
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-green-500 mr-2 text-xl">check</span>
                       <span className="text-gray-600">Gemini Flash Model</span>
                    </li>
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-green-500 mr-2 text-xl">check</span>
                       <span className="text-gray-600">5 Resumes per day</span>
                    </li>
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-green-500 mr-2 text-xl">check</span>
                       <span className="text-gray-600">Basic History</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0">
                  <Link to="/login" className="block w-full bg-indigo-50 border border-transparent rounded-xl py-3 text-center font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
                    Sign Up Free
                  </Link>
                </div>
             </div>

             {/* Pro Tier */}
             <div className="flex flex-col rounded-2xl shadow-xl border border-indigo-200 bg-white overflow-hidden relative transform scale-105 z-10">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                   Most Popular
                </div>
                <div className="p-8 pb-4 flex-1">
                  <h3 className="text-xl font-semibold text-indigo-600">Pro Power</h3>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">$19</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                  </p>
                  <p className="mt-6 text-gray-500">For serious career movers.</p>
                  <ul className="mt-6 space-y-4">
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-indigo-500 mr-2 text-xl">check_circle</span>
                       <span className="text-gray-900 font-medium">Gemini 3 Pro Model</span>
                    </li>
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-indigo-500 mr-2 text-xl">check_circle</span>
                       <span className="text-gray-900 font-medium">Unlimited Tailoring</span>
                    </li>
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-indigo-500 mr-2 text-xl">check_circle</span>
                       <span className="text-gray-900 font-medium">Google Sheets Sync</span>
                    </li>
                    <li className="flex items-start">
                       <span className="material-symbols-outlined text-indigo-500 mr-2 text-xl">check_circle</span>
                       <span className="text-gray-900 font-medium">Answer Generator</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0">
                  <Link to="/login" className="block w-full bg-indigo-600 border border-transparent rounded-xl py-3 text-center font-bold text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
                    Get Started
                  </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;