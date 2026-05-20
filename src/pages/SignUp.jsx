import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pharmSuiteLogo from '../assets/pharmSuite.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      const token =
        data.token ||
        data.jwt ||
        data.accessToken ||
        (data.data && (data.data.token || data.data.accessToken));

      if (token) {
        localStorage.setItem('pharmsuite_token', token);
        if (data.user || data.data?.user) {
          localStorage.setItem(
            'pharmsuite_user',
            JSON.stringify(data.user || data.data.user)
          );
        }
        navigate('/dashboard');
      } else {
        navigate('/signin');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="pharmacy-auth relative min-h-screen overflow-hidden px-4 py-10 flex items-center justify-center"
      style={{ fontFamily: 'Manrope, sans-serif' }}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl">

        <div className="auth-fade grid w-full overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-800 via-blue-700 to-sky-600 p-10 text-white md:flex">
            <div className="auth-rise">
              <div className="w-full rounded-2xl bg-white p-4 shadow-lg">
                <img src={pharmSuiteLogo} alt="PharmSuite" className="h-14 w-full object-contain" />
              </div>
              
            </div>
            <div className="auth-stagger space-y-3 text-sm text-blue-50">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Setup</span>
                <span>Launch with smart defaults and safety checks.</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Secure</span>
                <span>Protect data with role-based access and audit trails.</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Scale</span>
                <span>Grow to multiple branches with ease.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-10">
            <div className="auth-rise mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Create account
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Join PharmSuite</h2>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Repeat your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <a
              href={`${API_BASE}/api/auth/google`}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M44.5 20H24v8.5h11.9C34.6 33.4 29.9 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.3 0 6.2 1.3 8.5 3.5l6-6C34.8 5.7 29.7 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c10.4 0 20-7.5 20-20 0-1.3-.2-2.3-.5-4.5z"
                  fill="#4285F4"
                />
                <path
                  d="M6.3 14.7l7 5.1C15.1 16.2 19.2 12.7 24 12.7c3.3 0 6.2 1.3 8.5 3.5l6-6C34.8 5.7 29.7 3.5 24 3.5c-7.9 0-14.8 4.5-18.2 11.2z"
                  fill="#34A853"
                />
                <path
                  d="M24 44.5c5.7 0 10.8-2.2 14.6-5.7l-6.8-5.6c-1.9 1.4-4.4 2.3-7.8 2.3-5.8 0-10.6-3.9-12.3-9.1l-7.1 5.5C7.9 39.6 15.4 44.5 24 44.5z"
                  fill="#FBBC05"
                />
                <path
                  d="M11.7 26.4c-.4-1.2-.7-2.5-.7-3.9s.2-2.7.7-3.9l-7-5.1C3.6 16.7 2.5 20.2 2.5 24s1.1 7.3 3.2 10.5l7-5.1z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </a>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
