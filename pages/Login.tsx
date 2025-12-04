import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, signup } from '../services/authService';
import { User } from '../types';

interface LoginProps {
  setUser: (u: User) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Security States
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, ans: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize Captcha on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, ans: n1 + n2 });
    setCaptchaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Security Check
    if (parseInt(captchaInput) !== captcha.ans) {
      setError("Incorrect Captcha. Please prove you are human.");
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      let user: User;
      if (isLogin) {
        user = await login(email, password);
      } else {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        user = await signup(email, name, password);
      }
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed");
      generateCaptcha(); // Reset captcha on error
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    generateCaptcha();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      
      {/* Navigation */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md">
          <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
           <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
             <span className="material-symbols-outlined text-white text-4xl">description</span>
           </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? 'Access your tailored resumes' : 'Join ResuMate and get hired faster'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-indigo-100 sm:rounded-2xl sm:px-10 border border-indigo-50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Name Field (Signup Only) */}
            {!isLogin && (
              <div className="animate-fade-in-down">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Security Captcha */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Security Verification</label>
              <div className="flex items-center space-x-3">
                 <div className="bg-white px-4 py-2 rounded border border-gray-300 font-mono text-lg font-bold text-gray-700 tracking-widest select-none">
                    {captcha.num1} + {captcha.num2} = ?
                 </div>
                 <input
                    type="number"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="block w-20 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center font-bold"
                    placeholder="#"
                 />
                 <button 
                    type="button" 
                    onClick={generateCaptcha} 
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Refresh Captcha"
                 >
                    <span className="material-symbols-outlined">refresh</span>
                 </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center animate-shake">
                <span className="material-symbols-outlined mr-2 text-lg">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-70 transition-all transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Verifying & {isLogin ? 'Signing in' : 'Creating Account'}...
                </span>
              ) : (
                isLogin ? 'Sign in' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">
                  {isLogin ? "Don't have an account?" : "Already a member?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={toggleMode}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all"
              >
                {isLogin ? "Create an account" : "Log in to existing account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
