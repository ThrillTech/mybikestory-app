"use client";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const COUNTRY_CODES = [
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+1",  label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+64", label: "🇳🇿 +64" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+254", label: "🇰🇪 +254" },
  { code: "+263", label: "🇿🇼 +263" },
  { code: "+260", label: "🇿🇲 +260" },
  { code: "+267", label: "🇧🇼 +267" },
  { code: "+264", label: "🇳🇦 +264" },
];

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+27");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (phone.length < 9) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    const fullPhone = `${phonePrefix}${phone}`;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: { phone: fullPhone },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <img
            src="/MyBikeStory_logo.png"
            alt="MyBikeStory"
            className="h-28 w-auto mx-auto mb-2"
          />
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Free to join. List and buy bikes with verified history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="phone">Contact Number</Label>
                <div className="flex gap-2">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white w-24 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="82 555 1234"
                    className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Repeat Password */}
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    tabIndex={-1}
                  >
                    {showRepeatPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: "#2376BE" }}
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Free Account"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              {"Already have an account? "}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 font-semibold"
                style={{ color: "#2376BE" }}
              >
                Sign in
              </Link>
            </div>
            <div className="mt-3 text-center">
              <Link
                href="/listings"
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Browse bikes without signing up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
