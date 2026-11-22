import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { toListItems } from "@/lib/model-list"
import TimelineClient from "@/components/timeline-client"

// Server shell: header and layout render on the server. The
// timeline rail and modals live in the client island, which holds the
// only client-side copy of the dataset.
export default function TimelinePage() {
  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <TimelineClient models={toListItems(modelsData)} />
    </main>
  )
}
