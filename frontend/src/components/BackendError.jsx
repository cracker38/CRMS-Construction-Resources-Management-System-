export default function BackendError() {
  const isGitHubPages = window.location.hostname.includes('github.io')
  
  if (!isGitHubPages) return null

  return (
    <div className="fixed top-4 right-4 max-w-md bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">Backend Not Connected</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>The frontend is deployed, but the backend API is not available yet.</p>
            <p className="mt-2 font-semibold">To fix this:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Deploy backend to Render.com</li>
              <li>Update <code className="bg-yellow-100 px-1 rounded">frontend/vite.config.js</code></li>
              <li>Set <code className="bg-yellow-100 px-1 rounded">BACKEND_URL</code> to your Render URL</li>
              <li>Rebuild and redeploy frontend</li>
            </ol>
            <p className="mt-2 text-xs">
              See <code className="bg-yellow-100 px-1 rounded">DEPLOYMENT.md</code> for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

