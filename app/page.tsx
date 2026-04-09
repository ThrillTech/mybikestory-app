import Link from "next/link";
import MbsHeader from "@/components/mbs-header";
import MbsFooter from "@/components/mbs-footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <MbsHeader />

      {/* Hero */}
      <section
        className="py-20 px-5 text-center"
        style={{ background: "linear-gradient(to bottom, #EBF5FF, white)" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Buy &amp; Sell Bikes with
          <br />
          <span style={{ color: "#2376BE" }}>Verified History</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          South Africa&apos;s only second-hand bike marketplace where the full service
          history transfers with the bike. No more guessing what you&apos;re buying.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/listings"
            className="text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            style={{ backgroundColor: "#2376BE" }}
          >
            Browse Bikes
          </Link>
          <Link
            href="/sell"
            className="px-8 py-3 rounded-lg font-semibold text-lg border-2 transition-colors"
            style={{ borderColor: "#2376BE", color: "#2376BE" }}
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
              Find your next bike from verified sellers. Look for the Bike Service Book Verified
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
              Once sold, the bike&apos;s full Bike Service Book service history transfers into your
              account for R99. Your bike&apos;s story continues.
            </p>
          </div>
        </div>
      </section>

      {/* Bike Service Book Verified callout */}
      <section className="py-16 px-5" style={{ backgroundColor: "#EBF5FF" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: "#AA9F47" }}
          >
            ✓ Bike Service Book Verified
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
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: "#2376BE" }}
          >
            View Verified Listings
          </Link>
        </div>
      </section>

      {/* Bike Service Book Features — why buyers should use Bike Service Book */}
      <section className="py-16 px-5 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/MyBikeStory_logo.png"
              alt="MyBikeStory"
              className="h-20 w-auto"
            />
            <span className="text-gray-300 text-2xl font-light">×</span>
            <a href="https://www.bikeservicebook.com" target="_blank" rel="noreferrer">
              <img
                src="/BSB_flat logo_TM (1).png"
                alt="Bike Service Book"
                className="h-14 w-auto rounded-xl"
              />
            </a>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Why Buy a Bike Service Book Verified Bike?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm">
            When you claim a bike&apos;s history into your Bike Service Book account,
            you get far more than a receipt. Here&apos;s what comes with every verified bike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Feature 1 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">📋</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Complete Service History</h3>
              <p className="text-gray-500 text-sm">
                Every service, replacement, and upgrade documented in a verified
                service book. Proof of proper maintenance when you need it most —
                for warranty claims, resale, or insurance.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">🏷️</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Proof of Ownership</h3>
              <p className="text-gray-500 text-sm">
                Your bike&apos;s serial number, registered in your service book under
                your name. If your bike is stolen and recovered, you have documented
                proof it belongs to you — something a receipt alone can&apos;t always provide.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">🔔</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Never Miss a Service</h3>
              <p className="text-gray-500 text-sm">
                Get reminders when components need servicing based on actual usage.
                Your service book keeps you on schedule — protecting performance
                and preventing expensive failures.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">🚴</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Strava Integration</h3>
              <p className="text-gray-500 text-sm">
                Connect Strava to automatically log riding hours. Your service book
                updates with every ride — no manual entry required. Know exactly
                when each component needs attention.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">📄</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Downloadable PDF Report</h3>
              <p className="text-gray-500 text-sm">
                Generate a professional service history PDF at any time. Share it
                with a buyer, attach it to an insurance claim, or keep it for your
                records. Your entire bike history in one clean, shareable document.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Insurance Claims Made Easy</h3>
              <p className="text-gray-500 text-sm">
                In the event of theft or damage, insurers need proof of ownership
                and value. Your Bike Service Book provides a timestamped record
                with serial number, photos, and full history — everything your
                insurer needs to process a claim quickly.
              </p>
            </div>
          </div>

        </div>

        {/* Bike Service Book CTA */}
        <div
          className="mt-10 rounded-xl p-6 md:p-8 text-center"
          style={{ backgroundColor: "#EBF5FF" }}
        >
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            Start Your Free Bike Service Book
          </h3>
          <p className="text-gray-500 text-sm max-w-xl mx-auto mb-6">
            Track your new bike&apos;s service history, prove ownership, and protect
            your investment. Free to start — no credit card required.
          </p>
          <a
            href="https://www.bikeservicebook.com"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: "#2376BE" }}
          >
            Visit Bike Service Book →
          </a>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="py-16 px-5 text-center" style={{ backgroundColor: "#EBF5FF" }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Selling Your Bike?
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          List for free. If your bike is in Bike Service Book, your listing
          auto-fills with your full service history — giving buyers the
          confidence to pay your asking price.
        </p>
        <Link
          href="/sell"
          className="text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          style={{ backgroundColor: "#2376BE" }}
        >
          List Your Bike — Free
        </Link>
      </section>

      <MbsFooter />
    </main>
  );
}
