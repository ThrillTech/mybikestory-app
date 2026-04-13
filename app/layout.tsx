import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  title: "MyBikeStory | Buy & Sell Second-Hand Bikes in South Africa",
  description: "South Africa's trusted marketplace for second-hand bikes. Every listing includes verified service history from the Bike Service Book. Browse, buy, or sell today.",
  keywords: ["second hand bikes SA", "used bikes South Africa", "buy sell bicycle", "bike service history"],
  openGraph: {
    title: "MyBikeStory",
    description: "Buy and sell second-hand bikes with verified service history.",
    url: "https://mybikestory.co.za",
    siteName: "MyBikeStory",
    locale: "en_ZA",
    type: "website",
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
      <body className={`${poppins.variable} font-sans antialiased bg-white text-gray-900`}>
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
