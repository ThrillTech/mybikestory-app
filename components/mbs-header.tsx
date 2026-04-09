import Link from "next/link";

export default function MbsHeader() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/MyBikeStory_logo.png"
            alt="MyBikeStory"
            className="h-20 w-auto"
          />
        </Link>
       <div className="flex items-center gap-4">
          <Link
            href="/listings"
            className="text-sm font-medium text-gray-600 hover:text-[#2376BE] transition-colors hidden sm:block"
          >
            Browse Bikes
          </Link>
          <Link
            href="/sell"
            className="text-sm font-medium text-gray-600 hover:text-[#2376BE] transition-colors hidden sm:block"
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
      </div>
    </header>
  );
}
