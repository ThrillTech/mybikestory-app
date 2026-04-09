import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚲</span>
            <span className="font-bold text-xl text-gray-900">MyBikeStory</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">
              Browse Bikes
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

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-5 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Buy &amp; Sell Bikes with
          <br />
          <span className="text-green-600">Verified History</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          South Africa&apos;s only second-hand bike marketplace where the full service
          history transfers with the bike. No more guessing what you&apos;re buying.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/listings"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 text-lg"
          >
            Browse Bikes
          </Link>
          <Link
            href="/sell"
            className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 text-lg"
          >
            Sell Your Bike
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-5 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          How MyBikeStory Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">Browse Listings</h3>
            <p className="text-gray-600 text-sm">
              Find your next bike from verified sellers. Look for the BSB Verified
              badge for bikes with full service history.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="font-bold text-lg mb-2">Deal Directly</h3>
            <p className="text-gray-600 text-sm">
              Contact the seller, arrange viewing and payment privately. No
              middleman, no escrow — just honest transactions.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-bold text-lg mb-2">Transfer the History</h3>
            <p className="text-gray-600 text-sm">
              Once sold, the bike&apos;s full BSB service history transfers into your
              account for R99. Your bike&apos;s story continues.
            </p>
          </div>
        </div>
      </section>

      {/* BSB Verified callout */}
      <section className="bg-green-50 py-16 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
            ✓ BSB Verified
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Know Exactly What You&apos;re Buying
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Bikes listed from Bike Service Book users carry a verified service
            history — every service, every component, every shop stamp. It&apos;s the
            CarFax for bicycles.
          </p>
          <Link
            href="/listings?verified=true"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            View Verified Listings
          </Link>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="py-16 px-5 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Selling Your Bike?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          List for free. If your bike is in Bike Service Book, your listing
          auto-fills with your full service history — giving buyers the confidence
          to pay your asking price.
        </p>
        <Link
          href="/sell"
          className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700"
        >
          List Your Bike — Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-5 text-center text-sm text-gray-500">
        <p>
          MyBikeStory is powered by Bike Service Book — the service history
          platform for serious cyclists.
        </p>
      </footer>
    </main>
  );
}
