
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Sidebar from "./admin/components/Sidebar";
import AdminHeader from "./admin/components/AdminHeader";

export const metadata = {
  title: "Admin Dashboard | LV's Trendz",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        <AdminHeader user={{ name: user.name, email: user.email || "" }} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

