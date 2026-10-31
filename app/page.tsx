import Header from "@/components/header"
import HomeClient from "@/components/home-client"

// Server shell: header and metadata render on the server. All
// homepage interactivity (tabs, search, modals) lives in the HomeClient
// island, which holds the only client-side copy of the dataset.
export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <HomeClient />
    </main>
  )
}
