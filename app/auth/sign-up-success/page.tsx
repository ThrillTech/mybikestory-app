import Link from "next/link";
import MbsHeader from "@/components/mbs-header";
import MbsFooter from "@/components/mbs-footer";

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <MbsHeader />

      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            We&apos;ve sent a confirmation link to your email address. Click the
            link to activate your account and start listing bikes.
          </p>
          <div
            className="rounded-lg p-4 text-sm mb-6"
            style={{ backgroundColor: "#EBF5FF" }}
          >
            <p className="font-semibold mb-1" style={{ color: "#2376BE" }}>
              Didn&apos;t receive the email?
            </p>
            <p className="text-gray-500 text-xs">
              Check your spam folder. The email comes from Bike Service Book.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/listings"
              className="text-white py-3 rounded-lg font-semibold text-sm transition-colors"
              style={{ backgroundColor: "#2376BE" }}
            >
              Browse Bikes While You Wait
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium py-2"
              style={{ color: "#2376BE" }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <MbsFooter />
    </main>
  );
}
