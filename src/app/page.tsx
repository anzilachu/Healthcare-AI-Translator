import { Translator } from "../../component/Translator";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 pb-40 font-sans dark:bg-black sm:pb-6">
      <Translator />
    </div>
  );
}
