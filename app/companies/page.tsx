import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { toListItems } from "@/lib/model-list"
import CompaniesClient from "@/components/companies-client"

// Server shell: header and layout render on the server. The lab
// grid and modals live in the client island, which receives only the
// slim list it renders (lib/model-list); provenance loads on demand.
export default function CompaniesPage() {
  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <CompaniesClient models={toListItems(modelsData)} />
    </main>
  )
}
