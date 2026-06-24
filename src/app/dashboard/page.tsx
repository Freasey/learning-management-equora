import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleHome } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Dispatcher: arahkan pengguna ke dashboard sesuai peran setelah login. */
export default async function DashboardDispatch() {
  const session = await auth();
  if (!session?.user) redirect("/masuk");
  redirect(roleHome(session.user.roles));
}
