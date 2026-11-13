import { Suspense } from "react"
import { checkUser } from "@/actions/check-user"
import { redirect } from "next/navigation"

const DashboardPage = () => {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-sm text-gray-500">Loading dashboard...</p>
    </div>
  )
}

async function DashboardContent() {
  const user = await checkUser()
  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-gray-500">Welcome to the dashboard</p>
    </div>
  )
}

export default DashboardPage
