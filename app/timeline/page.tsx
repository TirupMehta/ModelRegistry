import Header from "@/components/header"
import Footer from "@/components/footer"
import TimelineClient from "@/components/timeline-client"

// Server shell: header, footer, and layout render on the server. The
// timeline rail and modals live in the client island, which holds the
// only client-side copy of the dataset.
export default function TimelinePage() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <TimelineClient />
      <Footer />
    </main>
  )
}
