import CalorieTracker from "@/components/CalorieTracker";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-4 top-6 z-50 flex items-center">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
      <CalorieTracker />
    </div>
  );
}

