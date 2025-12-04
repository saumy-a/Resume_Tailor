import React, { useState } from 'react';
import { User, ModelType } from '../types';
import { updateUserModel, isUsingSystemUrl } from '../services/sheetService';

interface ProfileProps {
  user: User;
  setUser: (u: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [selectedModel, setSelectedModel] = useState<ModelType>(user.model_choice);
  const [savingModel, setSavingModel] = useState(false);

  const handleSaveModel = async () => {
    setSavingModel(true);
    await updateUserModel(user.user_id, selectedModel);
    setUser({ ...user, model_choice: selectedModel });
    setSavingModel(false);
  };

  const isSystemConnected = isUsingSystemUrl();

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

      {/* Database Status */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Database Connection</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            System status for cloud synchronization.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
           {isSystemConnected ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>System Database Connected</strong>
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                       Your account, resumes, and answers are automatically synced to the central Google Sheet.
                       You can log in from any device.
                    </p>
                  </div>
                </div>
              </div>
           ) : (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
               <p className="text-sm text-yellow-700">
                 System database is not configured in code. Please check configuration.
               </p>
             </div>
           )}
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="bg-white shadow sm:rounded-lg border-l-4 border-red-400 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-red-50">
          <h3 className="text-lg leading-6 font-bold text-red-800 flex items-center">
            <span className="material-symbols-outlined mr-2">build</span>
            Troubleshooting: DriveApp Permission Error
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-red-700">
            If you see <strong>[Upload Error: You do not have permission to call DriveApp.createFolder...]</strong>
          </p>
        </div>
        <div className="border-t border-red-200 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-700 mb-3">
              Google Apps Script creates "ResuMate Uploads" folder in your Drive to store PDFs. You must grant this permission manually.
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Open your <a href="https://script.google.com" target="_blank" className="text-indigo-600 underline font-medium">Google Apps Script Project</a>.</li>
              <li>Paste the code containing <code>DriveApp.createFolder("Temp")</code> inside <code>setup</code> (see user guide).</li>
              <li>In the toolbar, select <code>setup</code> and click <strong>Run</strong>.</li>
              <li><strong>Accept Permissions</strong> in the popup (Review -> Advanced -> Go to -> Allow).</li>
              <li><strong>CRITICAL:</strong> Click <strong>Deploy</strong> &rarr; <strong>Manage Deployments</strong> &rarr; <strong>Edit</strong> &rarr; <strong>New Version</strong> &rarr; <strong>Deploy</strong>.</li>
            </ol>
            <p className="text-sm text-gray-500 mt-4 italic">
              Without the "New Version" deployment step, your live app will continue using the old permissions (Snapshot).
            </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;