import Header from "@/components/header"
import Footer from "@/components/footer"
import LeaderboardClient from "@/components/leaderboard-client"

// Server shell: header, footer, and layout render on the server. The
// leaderboard table, spotlight filters, and modals live in the client
// island, which holds the only client-side copy of the dataset.
export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <LeaderboardClient />
      <Footer />
    </main>
  )
}
