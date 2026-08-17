import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Govern Chatbot API",
  description: "Backend IA pour le chatbot Eynam — Govern One",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
