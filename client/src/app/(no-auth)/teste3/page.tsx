import dynamic from "next/dynamic";

// Carregue o componente dinamicamente com `ssr: false`
const StreamComponent = dynamic(() => import("./stream"), {
  ssr: false,
});

export default function StreamPage() {
  return <StreamComponent />;
}
