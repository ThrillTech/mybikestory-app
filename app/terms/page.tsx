import MbsHeader from "@/components/mbs-header";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: April 2026</p>

          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">1. Free to List</h2>
              <p>Listing a bike on MyBikeStory is free. No upfront fees apply.</p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">2. Commission on Sale</h2>
              <p className="mb-3">
                When you mark a bike as sold, a sliding-scale commission is payable to MyBikeStory via Paystack before the listing closes:
              </p>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#2376BE" }} className="text-white">
                      <th className="text-left px-4 py-2 font-semibold">Sale Price</th>
                      <th className="text-right px-4 py-2 font-semibold">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["R0 – R2,500", "10%"],
                      ["R2,501 – R5,000", "7.5%"],
                      ["R5,001 – R15,000", "5%"],
                      ["R15,001 – R30,000", "3%"],
                      ["R30,001+", "2%"],
                    ].map(([range, rate], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2">{range}</td>
                        <td className="px-4 py-2 text-right font-semibold" style={{ color: "#2376BE" }}>{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">3. Direct Transactions</h2>
              <p>
                MyBikeStory does not handle payments between buyers and sellers. All payment and collection arrangements are made privately between the parties.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">4. No Escrow &amp; No Liability</h2>
              <p>
                MyBikeStory is not liable for disputes, non-payment, fraud, or misrepresentation between buyers and sellers. Use caution when meeting strangers and always meet in a public place.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">5. Accurate Listings</h2>
              <p>
                You agree to list only bikes you own and to describe them honestly. Misleading listings, stolen goods, or fraudulent listings will be removed immediately and may be reported to authorities.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">6. Ownership Transfer Fee</h2>
              <p>
                The buyer pays a R99 fee to claim the bike&apos;s verified service history via Bike Service Book. This fee is non-refundable once the transfer is completed.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">7. Listing Expiry</h2>
              <p>Listings expire after 90 days and may be renewed free of charge.</p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">8. Removal of Listings</h2>
              <p>
                MyBikeStory reserves the right to remove any listing that violates these terms without notice or liability.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">9. Protection of Personal Information (POPIA)</h2>
              <p className="mb-3">
                MyBikeStory collects and processes personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).
              </p>
              <ul className="space-y-2">
                {[
                  "We collect only the information necessary to provide our service — name, email address, phone number, and listing details.",
                  "Your personal information is stored securely on Supabase infrastructure and is never sold to third parties.",
                  "Your contact details are displayed on your listing to enable buyers to contact you directly. By publishing a listing you consent to this display.",
                  "You may request access to, correction of, or deletion of your personal information at any time by contacting us at ben@thrilltech.co.za.",
                  "MyBikeStory uses Paystack to process commission payments. Paystack's own privacy policy governs any financial data they collect.",
                  "In the event of a data breach that affects your personal information, we will notify you within a reasonable time as required by POPIA.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: "#2376BE" }} className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">10. Consent</h2>
              <p>
                By creating an account and publishing a listing on MyBikeStory, you confirm that you have read, understood, and agree to these Terms &amp; Conditions and consent to the processing of your personal information as described above.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">11. Governing Law</h2>
              <p>These terms are governed by the laws of the Republic of South Africa.</p>
            </section>

            <section>
              <h2 className="font-bold text-gray-900 text-base mb-2">12. Contact</h2>
              <p>
                ThrillTech Mechanical Risk Intelligence (Pty) Ltd
                <br />
                <a href="mailto:ben@thrilltech.co.za" style={{ color: "#2376BE" }} className="underline">
                  ben@thrilltech.co.za
                </a>
                <br />
                Johannesburg, South Africa
              </p>
            </section>
          </div>

          <div className="border-t border-gray-200 mt-10 pt-6 text-center">
            <Link
              href="/sell"
              className="text-sm font-semibold text-white px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: "#2376BE" }}
            >
              Back to Listing Form
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-8 px-5 text-center text-sm text-gray-500">
        <p>MyBikeStory is powered by Bike Service Book — the service history platform for serious cyclists.</p>
      </footer>
    </main>
  );
}
