import Header from "@/components/header"
import CompaniesClient from "@/components/companies-client"

// Server shell: header and layout render on the server. The lab
// grid and modals live in the client island, which holds the only
// client-side copy of the dataset.
export default function CompaniesPage() {
  return (
    <main className="relative min-h-screen">
      <Header />
      <CompaniesClient />
    </main>
  )
}
