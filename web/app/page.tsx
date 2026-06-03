import { redirect } from "next/navigation";

// The middleware handles auth; just send everyone to the dashboard
// (unauthenticated users get bounced to /login there).
export default function Home() {
  redirect("/dashboard");
}
