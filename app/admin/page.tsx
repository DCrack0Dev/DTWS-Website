import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function AdminHomePage() {
  const session = cookies().get("session")?.value;
  redirect(session ? "/dashboard/command" : "/login?next=/dashboard/command");
}
