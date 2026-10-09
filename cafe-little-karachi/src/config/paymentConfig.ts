/**
 * Online Payment Configuration for Little Karachi Express
 * Supports manual local transfers (JazzCash, EasyPaisa, Bank Transfer)
 * Update details here or override via environment variables.
 */

export interface PaymentAccountDetails {
  id: "jazzcash" | "easypaisa" | "bank_transfer";
  name: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  iban?: string;
  instructions: string;
  badgeColor: string;
}

export const PAYMENT_CONFIG = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923331702706",
  supportPhone: "0333 1702706",
  methods: [
    {
      id: "jazzcash" as const,
      name: "JazzCash",
      accountTitle: process.env.NEXT_PUBLIC_JAZZCASH_TITLE || "Little Karachi Express",
      accountNumber: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "0300 1234567",
      instructions: "Transfer the exact order amount to this JazzCash mobile account and share screenshot on WhatsApp.",
      badgeColor: "#ea580c", // Orange/Amber
    },
    {
      id: "easypaisa" as const,
      name: "EasyPaisa",
      accountTitle: process.env.NEXT_PUBLIC_EASYPAISA_TITLE || "Little Karachi Express",
      accountNumber: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "0333 1702706",
      instructions: "Transfer the exact order amount to this EasyPaisa mobile account and share screenshot on WhatsApp.",
      badgeColor: "#16a34a", // Green
    },
    {
      id: "bank_transfer" as const,
      name: "Bank Transfer",
      bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Meezan Bank Ltd",
      accountTitle: process.env.NEXT_PUBLIC_BANK_TITLE || "Little Karachi Express",
      accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "01020304050607",
      iban: process.env.NEXT_PUBLIC_BANK_IBAN || "PK00MEZN0001020304050607",
      instructions: "Transfer via online banking or mobile app to this account and share screenshot on WhatsApp.",
      badgeColor: "#2563eb", // Blue
    },
  ],
};

export type PaymentMethodId = "cash" | "online";
export type OnlineProviderId = "jazzcash" | "easypaisa" | "bank_transfer";
