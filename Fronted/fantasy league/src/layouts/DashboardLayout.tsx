import { Outlet } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"

export default function DashboardLayout() {
  return (
    <AppLayout title="ShadowLeague Sports Analytics">
      <Outlet />
    </AppLayout>
  )
}