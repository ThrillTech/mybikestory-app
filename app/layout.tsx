import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mybikestory.co.za"),
  title: {
    default: "MyBikeStory | Buy & Sell Second-Hand Bikes in South Africa",
    template: "%s | MyBikeStory",
  },
  description:
    "South Africa's trusted marketplace for second-hand bikes. Every listing includes verified service history from the Bike Service Book. Browse, buy, or sell today.",
  keywords: [
    "second hand bikes South Africa",
    "used bikes for sale SA",
    "buy bicycle South Africa",
    "sell my bike",
    "bike service history",
    "verified bike history",
    "BSB bike service book",
    "second hand MTB South Africa",
    "used road bike SA",
  ],
  openGraph: {
    title: "MyBikeStory | Buy & Sell Second-Hand Bikes in South Africa",
    description:
      "Buy and sell second-hand bikes with verified service history. South Africa's trusted bike marketplace.",
    url: "https://www.mybikestory.co.za",
    siteName: "MyBikeStory",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBikeStory | Buy & Sell Second-Hand Bikes in South Africa",
    description:
      "South Africa's trusted marketplace for second-hand bikes with verified service history.",
  },
  alternates: {
    canonical: "https://www.mybikestory.co.za",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const poppins = Poppins({
  variable: "--font-poppins",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
