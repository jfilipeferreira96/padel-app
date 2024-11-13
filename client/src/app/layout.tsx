import type { Metadata } from "next";
import Theme from "./theme";

export const metadata: Metadata = {
  title: "Pro Padel",
  description: "Pro Padel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="pt">
      <body>
        <Theme>
          {children}
        </Theme>
      </body>
    </html>
  );
}
