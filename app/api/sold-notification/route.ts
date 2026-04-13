import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "MyBikeStory <sales@bikeservicebook.com>";
const BSB_URL = "https://www.bikeservicebook.com";
const MBS_URL = "https://www.mybikestory.co.za";

interface SoldNotificationPayload {
  saleId: string;
  listingTitle: string;
  salePrice: number; // in cents
  commissionRate: string;
  commissionAmount: number; // in rands
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  hasBsbHistory: boolean;
}

export async function POST(req: Request) {
  try {
    const payload: SoldNotificationPayload = await req.json();

    const {
      listingTitle,
      salePrice,
      commissionRate,
      commissionAmount,
      sellerEmail,
      buyerName,
      buyerEmail,
      hasBsbHistory,
    } = payload;

    const salePriceRands = salePrice / 100;

    // ── SELLER EMAIL ──────────────────────────────────────────────
    await resend.emails.send({
      from: FROM,
      to: sellerEmail,
      subject: `Commission Invoice — ${listingTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:#2376BE;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">MyBikeStory</h1>
              <p style="margin:6px 0 0;color:#bfe0ff;font-size:13px;">Powered by Bike Service Book</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Congratulations on your sale! 🎉</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Your listing <strong style="color:#111827;">${listingTitle}</strong> has been marked as sold. 
                Please pay the commission invoice below to release the Bike Service Book history to the buyer.
              </p>

              <!-- Invoice box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;">Sale price (paid directly by buyer to you)</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#111827;">R${salePriceRands.toLocaleString("en-ZA")}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #bfdbfe;padding-top:12px;margin-top:8px;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#111827;">Commission owed to MyBikeStory (${commissionRate})</td>
                        <td align="right" style="font-size:15px;font-weight:700;color:#ef4444;">R${commissionAmount.toLocaleString("en-ZA")}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <p style="margin:0 0 24px;color:#6b7280;font-size:13px;line-height:1.6;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;">
                <strong style="color:#92400e;">Note:</strong> The buyer pays you directly for the bike. The commission above is owed separately to MyBikeStory and must be paid via the button below.
              </p>

              <!-- Pay button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${MBS_URL}/pay/commission?sale=${payload.saleId}"
                       style="display:inline-block;background:#2376BE;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">
                      Pay R${commissionAmount.toLocaleString("en-ZA")} Commission to MyBikeStory
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

              <!-- Bike Service Book upsell -->
              <h3 style="margin:0 0 8px;font-size:16px;color:#111827;font-weight:700;">Ready for your next bike? 🚲</h3>
              <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
                Thank you for being part of the Bike Service Book community. Start building the service history 
                for your next bike today — buyers pay more for bikes with a verified Bike Service Book record.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${BSB_URL}/bikes/add"
                       style="display:inline-block;background:#AA9F47;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
                      Add My New Bike to Bike Service Book
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                MyBikeStory · Powered by Bike Service Book<br/>
                <a href="${MBS_URL}" style="color:#2376BE;text-decoration:none;">www.mybikestory.co.za</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    // ── BUYER EMAIL ───────────────────────────────────────────────
    await resend.emails.send({
      from: FROM,
      to: buyerEmail,
      subject: `Welcome to MyBikeStory — Your new bike is waiting! 🚲`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#2376BE;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Welcome to MyBikeStory</h1>
              <p style="margin:6px 0 0;color:#bfe0ff;font-size:13px;">Powered by Bike Service Book</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Hi ${buyerName}! Your bike is on its way 🎉</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                You've been registered as the new owner of 
                <strong style="color:#111827;">${listingTitle}</strong>. 
                Congratulations on your new ride!
              </p>

              ${hasBsbHistory ? `
              <!-- Bike Service Book Transfer box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 8px;font-size:15px;color:#92400e;font-weight:700;">✓ This bike has a verified Bike Service Book history</h3>
                    <p style="margin:0 0 16px;color:#78350f;font-size:13px;line-height:1.6;">
                      The seller has maintained a full Bike Service Book record for this bike. 
                      To claim ownership and access the complete history, create a free Bike Service Book account 
                      and pay the once-off R99 transfer fee.
                    </p>
                    <a href="${BSB_URL}/auth/sign-up"
                       style="display:inline-block;background:#AA9F47;color:#ffffff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-right:10px;">
                      Create Bike Service Book Account
                    </a>
                    <a href="${MBS_URL}/pay/transfer?email=${buyerEmail}"
                       style="display:inline-block;background:#2376BE;color:#ffffff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;">
                      Pay R99 Transfer Fee
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Bike Service Book Benefits -->
              <h3 style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:700;">Why Bike Service Book? 🏆</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;">📋</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">Full Service History</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Every service, repair and upgrade logged in one place</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;">🔧</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">Component Tracking</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Track wear on brakes, chain, tyres and more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;">💰</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">Higher Resale Value</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Bikes with Bike Service Book records sell faster and for more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;">🛡️</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">Theft Deterrent</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Serial number registration makes stolen bikes traceable</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Tips CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 6px;font-size:15px;color:#1e40af;font-weight:700;">💡 New to Bike Service Book? Start with our Tips</h3>
                    <p style="margin:0 0 14px;color:#3b82f6;font-size:13px;line-height:1.5;">
                      Our Tips page covers everything from logging your first service to getting the most 
                      out of your component tracker.
                    </p>
                    <a href="${BSB_URL}/tips"
                       style="display:inline-block;background:#2376BE;color:#ffffff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:8px;text-decoration:none;">
                      View Bike Service Book Tips
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign up CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${BSB_URL}/auth/sign-up"
                       style="display:inline-block;background:#AA9F47;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">
                      Create My Free Bike Service Book Account
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                MyBikeStory · Powered by Bike Service Book<br/>
                <a href="${MBS_URL}" style="color:#2376BE;text-decoration:none;">www.mybikestory.co.za</a> · 
                <a href="${BSB_URL}" style="color:#2376BE;text-decoration:none;">www.bikeservicebook.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("sold-notification error:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
