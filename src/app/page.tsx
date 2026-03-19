import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const currentUser = await getCurrentUser();
  redirect(currentUser ? "/dashboard" : "/login");
}
