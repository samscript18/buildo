import { Suspense } from "react";
import { NewProject } from "@/components/workspace";
export default function Page() {
  return (
    <Suspense>
      <NewProject />
    </Suspense>
  );
}
