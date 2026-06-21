export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 items-center justify-center bg-sand/40 px-5 py-16">
      {children}
    </div>
  );
}
