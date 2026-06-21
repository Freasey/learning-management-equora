import { kidFontVars } from "@/lib/kid-fonts";

export default function StudentRegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${kidFontVars} font-kid flex min-h-screen items-center justify-center bg-cream px-5 py-12`}
    >
      {children}
    </div>
  );
}
