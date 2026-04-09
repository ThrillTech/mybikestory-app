import Link from "next/link";

export default function MbsHeader() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 h-25 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/MyBikeStory_logo.png"
            alt="MyBikeStory"
            className="h-16 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/listings"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Browse Bikes
          </Link>
          <Link
            href="/sell"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sell Your Bike
          </Link>
          <Link
            href="/auth/sign-in"
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
