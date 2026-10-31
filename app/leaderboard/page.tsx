import Header from "@/components/header"
import LeaderboardClient from "@/components/leaderboard-client"

// Server shell: header and layout render on the server. The
// leaderboard table, spotlight filters, and modals live in the client
// island, which holds the only client-side copy of the dataset.
export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <LeaderboardClient />
    </main>
  )
}
