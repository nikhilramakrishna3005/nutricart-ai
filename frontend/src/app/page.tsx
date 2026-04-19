import { redirect } from "next/navigation";

/**
 * Default entry: dashboard experience at `/planner`.
 */
export default function HomePage() {
  redirect("/planner");
}
