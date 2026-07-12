
import Image from "next/image";
import Link from "next/link";
import Navigation from "./Navigation";
import HeaderIcons from "./HeaderIcons";

export default function DesktopHeader() {
  return (
    <div className="hidden lg:block">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/images/lvs-logo.svg"
            alt="LV's Trendz"
            width={140}
            height={48}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </Link>

        {/* Navigation */}
        <Navigation />

        {/* Icons */}
        <HeaderIcons />
      </div>
    </div>
  );
}

