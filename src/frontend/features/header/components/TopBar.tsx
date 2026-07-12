import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="hidden border-b border-gray-200 lg:block">
      <div className="mx-auto flex h-11 max-w-[1440px] items-center justify-between px-6">

        <div className="flex items-center gap-6 text-[13px] text-gray-600">

          <div className="flex items-center gap-2">
            <Phone size={14} />
            <span>+91 9876543210</span>
          </div>

          <div className="flex items-center gap-2">
            <Mail size={14} />
            <span>hello@lvstrendz.com</span>
          </div>

        </div>

        <div className="flex items-center gap-5 text-[13px]">

          <Link
            href="/help"
            className="text-gray-700 hover:text-[#8C5B3E]"
          >
            Need Help?
          </Link>

          <Link
            href="/login"
            className="text-gray-700 hover:text-[#8C5B3E]"
          >
            Sign In
          </Link>

        </div>

      </div>
    </div>
  );
}