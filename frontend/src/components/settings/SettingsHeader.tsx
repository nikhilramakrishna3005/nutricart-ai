import { AppTopBar } from "@/components/shared/AppTopBar";

export function SettingsHeader() {
  return (
    <AppTopBar
      layout="stack"
      center={
        <>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight-head text-[#EEF2F7] sm:text-[28px]">
            Settings
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5E7590] sm:text-base">
            Manage your nutrition and app preferences
          </p>
        </>
      }
    />
  );
}
