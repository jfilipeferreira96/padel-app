import dynamic from "next/dynamic";
interface Props {
  params: { videoId: string };
}

// Carregue o componente dinamicamente com `ssr: false`
const StreamComponent = dynamic(() => import("./stream"), {
  ssr: false,
});

export default function StreamPage({ params }: Props) {
  return <StreamComponent params={params} />;
}
