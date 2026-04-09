import Link from "next/link";

export default function MbsHeader() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/MyBikeStory_logo.png"
            alt="MyBikeStory"
            className="h-20 w-auto"
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
          <Link
            href="/auth/sign-up"
            className="text-sm font-semibold border-2 border-[#2376BE] text-[#2376BE] px-4 py-2 rounded-lg hover:bg-[#EBF5FF] transition-colors"
          >
            Sign Up Free
          </Link>
          <Link
            href="/auth/sign-in"
            className="text-sm font-semibold bg-[#2376BE] text-white px-4 py-2 rounded-lg hover:bg-[#1a5a94] transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile nav — icon buttons only */}
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
          <Link
            href="/auth/sign-up"
            className="text-xs font-semibold border-2 border-[#2376BE] text-[#2376BE] px-3 py-2 rounded-lg"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/sign-in"
            className="text-xs font-semibold bg-[#2376BE] text-white px-3 py-2 rounded-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
