
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Sidebar from "./admin/components/Sidebar";
import AdminHeader from "./admin/components/AdminHeader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | LV's Trendz",
};

import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("lvs-session")?.value;
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl max-w-lg mx-auto mt-20 text-center font-sans">
        <h1 className="text-xl font-bold text-red-800 uppercase tracking-wide">Admin Access Blocked</h1>
        <div className="text-left bg-white p-4 border border-red-100 rounded-lg mt-4 text-xs font-mono space-y-2 text-gray-700">
          <p><strong>Cookie Present:</strong> {token ? "YES (starts with " + token.substring(0, 10) + "...)" : "NO"}</p>
          <p><strong>Decoded User:</strong> {user ? JSON.stringify(user) : "null"}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
        <a href="/login?redirect=%2Fadmin" className="mt-6 inline-block bg-[#A0463E] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
          Go To Login
        </a>
      </div>
    );
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

