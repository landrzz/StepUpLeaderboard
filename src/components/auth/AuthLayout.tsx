import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-step-green/10 via-white to-step-teal/10 text-black">
      {/* Apple-style navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-step-orange" />
              <Link to="/" className="font-bold text-xl text-step-teal">
                StepChallenge
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center pt-12">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-step-green/10 p-3 rounded-full">
                <Trophy className="h-12 w-12 text-step-orange" />
              </div>
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-step-teal">
              StepChallenge
            </h2>
            <p className="text-xl font-medium text-gray-500 mt-2">
              Admin access to manage your step challenge
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
