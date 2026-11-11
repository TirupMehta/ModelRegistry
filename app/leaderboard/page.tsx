import Header from "@/components/header"
import LeaderboardClient from "@/components/leaderboard-client"
import RankingsSwitcher from "@/components/rankings-switcher"

// Server shell: header and layout render on the server. The
// leaderboard table, spotlight filters, and modals live in the client
// island, which holds the only client-side copy of the dataset.
export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20">
        <RankingsSwitcher current="/leaderboard" />
      </div>
      <LeaderboardClient />
    </main>
  )
}
