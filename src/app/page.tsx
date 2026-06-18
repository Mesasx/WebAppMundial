import { getCurrentUser } from "@/lib/auth";
import { Landing } from "@/components/Landing";

export default async function Page() {
  const user = await getCurrentUser();
  return <Landing loggedIn={Boolean(user)} />;
}
