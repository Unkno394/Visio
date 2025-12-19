import { redirect } from "next/navigation";

export default async function LegacyHomeRedirect() {
  redirect("/");
}
