import Link from "next/link";

export default function MbsFooter() {
  return (
    <footer className="border-t border-gray-200 py-8 px-5 mt-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>
          MyBikeStory is powered by{" "}
          <a
            href="https://www.bikeservicebook.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
            style={{ color: "#2376BE" }}
          >
            Bike Service Book
          </a>
          {" — the service history platform for serious cyclists."}
        </p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">
            Terms &amp; Conditions
          </Link>
          <a
            href="mailto:ben@thrilltech.co.za"
            className="hover:text-gray-700 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
