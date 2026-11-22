import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { toListItems } from "@/lib/model-list"
import { buildDemoCards } from "@/components/stageshow/record-demo-cards"
import HomeClient from "@/components/home-client"
import AlertsPopup from "@/components/alerts-popup"
import QuickAnswers from "@/components/quick-answers"

// Server shell: header and metadata render on the server. All
// homepage interactivity (tabs, search, modals) lives in the HomeClient
// island, which holds the only client-side copy of the dataset.
export default function Home() {
  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <HomeClient models={toListItems(modelsData)} demoCards={buildDemoCards(modelsData)} quickAnswers={<QuickAnswers />} />
      <AlertsPopup />
    </main>
  )
}
