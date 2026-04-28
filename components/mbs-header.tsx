"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MbsHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const AuthButtons = ({ mobile }: { mobile?: boolean }) => {
    if (loading) return null;
    if (isLoggedIn) {
      return (
        <>
          <Link
            href="/dashboard"
            className={
              mobile
                ? "text-xs font-semibold border-2 border-[#2376BE] text-[#2376BE] px-3 py-2 rounded-lg"
                : "text-sm font-semibold border-2 border-[#2376BE] text-[#2376BE] px-4 py-2 rounded-lg hover:bg-[#EBF5FF] transition-colors"
            }
          >
            Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className={
              mobile
                ? "text-xs font-semibold bg-[#2376BE] text-white px-3 py-2 rounded-lg"
                : "text-sm font-semibold bg-[#2376BE] text-white px-4 py-2 rounded-lg hover:bg-[#1a5a94] transition-colors"
            }
          >
            Sign Out
          </button>
        </>
      );
    }
    return (
      <>
        <Link
          href="/auth/sign-up"
          className={
            mobile
              ? "text-xs font-semibold border-2 border-[#2376BE] text-[#2376BE] px-3 py-2 rounded-lg"
              : "text-sm font-semibold border-2 border-[#2376BE] text-[#2376BE] px-4 py-2 rounded-lg hover:bg-[#EBF5FF] transition-colors"
          }
        >
          {mobile ? "Sign Up" : "Sign Up Free"}
        </Link>
        <Link
          href="/auth/sign-in"
          className={
            mobile
              ? "text-xs font-semibold bg-[#2376BE] text-white px-3 py-2 rounded-lg"
              : "text-sm font-semibold bg-[#2376BE] text-white px-4 py-2 rounded-lg hover:bg-[#1a5a94] transition-colors"
          }
        >
          Sign In
        </Link>
      </>
    );
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/MyBikeStory_logo.png"
            alt="MyBikeStory"
            className="h-24 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/listings"
            className="text-sm font-medium text-gray-600 hover:text-[#2376BE] transition-colors"
          >
            Browse Bikes
          </Link>
          <Link
            href="/sell"
            className="text-sm font-medium text-gray-600 hover:text-[#2376BE] transition-colors"
          >
            Sell Your Bike
          </Link>
          <AuthButtons />
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/listings"
            className="text-xs font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200"
          >
            Browse
          </Link>
          <Link
            href="/sell"
            className="text-xs font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200"
          >
            Sell
          </Link>
          <AuthButtons mobile />
        </div>
      </div>
    </header>
  );
}
