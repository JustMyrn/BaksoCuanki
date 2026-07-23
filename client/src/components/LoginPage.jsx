import { useState } from 'react';

function LoginPage({ onBack, onNavigate }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col items-center overflow-hidden bg-[#FFFBF0] font-['Inter'] sm:max-w-md">
      {/* === Card Form === */}
      <div className="relative z-10 mt-[clamp(140px,22vh,165px)] w-[clamp(260px,79vw,307px)] rounded-[30px] bg-[#D5E8FA] px-[clamp(24px,8vw,32px)] py-[clamp(24px,5vh,32px)]">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <h3 className="text-[14px] font-bold tracking-[0.05em] text-[#04305F]">
            INTEGRA
          </h3>
          <h2 className="text-[32px] font-bold tracking-[0.05em] text-[#04305F]">
            Log In
          </h2>
        </div>

        {/* Form Fields */}
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-[13px] font-bold text-[#04305F]"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#04305F]">
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 4-10 8L2 4" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                placeholder=" "
                className="h-[41px] w-full rounded-none border border-[#04305F] bg-[#EFEFED] pl-9 pr-3 text-[13px] font-bold text-[#04305F] outline-none placeholder:text-[#04305F]/40"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-[13px] font-bold text-[#04305F]"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#04305F]">
                <svg
                  width="18"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                className="h-[41px] w-full border border-[#04305F] bg-[#EFEFED] pl-9 pr-10 text-[13px] font-bold text-[#04305F] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#04305F]/50"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <a
              href="#forgot"
              className="text-[10px] font-bold text-[#000000] hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Tombol Log In */}
          <button
            type="submit"
            className="mx-auto mt-1 w-[144px] rounded-[30px] bg-[#04305F] py-[10px] text-center text-[15px] font-bold tracking-[0.05em] text-white shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            Log In
          </button>
        </form>

        {/* Divider "Or" */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#000000]/20" />
          <span className="text-[10px] font-bold text-[#000000]">Or</span>
          <div className="h-px flex-1 bg-[#000000]/20" />
        </div>

        {/* Google Login */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-[11px] font-bold text-[#000000] shadow-sm transition-all hover:shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Sign Up redirect */}
        <p className="mt-4 text-center text-[10px] font-bold text-[#000000]">
          Don&rsquo;t have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('signup')}
            className="text-[#2716E0] hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>

      {/* Tombol Back */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 z-20 text-[#04305F]"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}

export default LoginPage;