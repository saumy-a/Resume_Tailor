import React, { useState, useEffect } from 'react';
import { User, ModelType } from '../types';
import { updateUserModel, getScriptUrl, setScriptUrl, saveUser } from '../services/sheetService';

interface ProfileProps {
  user: User;
  setUser: (u: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [selectedModel, setSelectedModel] = useState<ModelType>(user.model_choice);
  const [scriptUrlInput, setScriptUrlInput] = useState('');
  const [savingModel, setSavingModel] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    setScriptUrlInput(getScriptUrl());
  }, []);

  const handleSaveModel = async () => {
    setSavingModel(true);
    await updateUserModel(user.user_id, selectedModel);
    setUser({ ...user, model_choice: selectedModel });
    setSavingModel(false);
  };

  const handleSaveUrl = async () => {
    setSavingUrl(true);
    setScriptUrl(scriptUrlInput);
    
    // CRITICAL FIX: Sync the user to the sheet immediately after connection
    if (scriptUrlInput) {
      try {
        // We pass empty password hash here because we are just syncing the user info, 
        // not resetting the password. The backend won't overwrite existing hash if not provided (logic dependent), 
        // but for now we just ensure the user row exists.
        await saveUser(user);
        console.log("User synced to sheet successfully.");
      } catch (e) {
        console.error("Failed to sync user to sheet", e);
      }
    }

    // Simulate a small delay for better UX
    setTimeout(() => setSavingUrl(false), 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Settings */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and AI configurations.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">AI Model</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value={ModelType.FLASH}>Gemini 2.5 Flash (Fast & Efficient)</option>
                  <option value={ModelType.PRO}>Gemini 3 Pro Preview (Higher Quality)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Pro models require more tokens but provide deeper reasoning for complex JDs.
                </p>
                <button
                  onClick={handleSaveModel}
                  disabled={savingModel}
                  className="mt-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {savingModel ? 'Saving...' : 'Update Model Choice'}
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Google Sheets Sync Settings */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Google Sheets Sync</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Connect your personal Google Sheet database.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
           <div className="space-y-4">
              <div>
                <label htmlFor="scriptUrl" className="block text-sm font-medium text-gray-700">
                  Google Apps Script Web App URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="scriptUrl"
                    id="scriptUrl"
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="https://script.google.com/macros/s/..."
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Deploy your Apps Script as a Web App (Access: "Anyone") and paste the URL here.
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={handleSaveUrl}
                  disabled={savingUrl}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {savingUrl ? 'Connecting...' : 'Save Connection'}
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;