import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';

import { Charts } from './pages/Charts';
import { Settings } from './pages/Settings';
import { CycleHistory } from './pages/CycleHistory';
import { Gallery } from './pages/Gallery';
import { Analytics } from './pages/Analytics';
import { Tasks } from './pages/Tasks';

import { Zones } from './pages/Zones';
import { FarmProvider } from './context/FarmContext';
import { ThemeProvider } from './context/ThemeContext';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <pre className="bg-gray-100 p-4 rounded text-left overflow-auto max-w-2xl mx-auto text-sm">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FarmProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/*" element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/charts" element={<Charts />} />
                        <Route path="/history" element={<CycleHistory />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/zones" element={<Zones />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<div className="p-8 text-center text-red-500">404 - Page Not Found</div>} />
                      </Routes>
                    </Layout>
                  </PrivateRoute>
                } />
              </Routes>
            </BrowserRouter>
          </FarmProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
