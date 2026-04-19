import { Search } from "lucide-react";

export function ArticlesSearchBar() {
  return (
    <div
      className="mb-3 mt-2 flex w-full items-center gap-3 rounded-xl bg-[#1a1a1a] px-4 py-2.5 font-sans"
      role="search"
    >
      <Search className="size-5 shrink-0 text-[#5E7590]" strokeWidth={2} aria-hidden />
      <input
        type="search"
        placeholder="Search articles..."
        className="min-w-0 flex-1 border-0 bg-transparent text-base font-normal leading-normal text-[#EEF2F7] outline-none placeholder:text-[#5E7590] sm:text-[17px]"
        aria-label="Search articles"
      />
    </div>
  );
}
