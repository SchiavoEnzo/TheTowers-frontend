import Head from "next/head";
import dynamic from "next/dynamic";

const FieldArchive = dynamic(() => import("../ui/FieldArchive"), {
  ssr: false,
  loading: () => <p>Carregando arquivo de campo…</p>,
});

export default function Home() {
  return <><Head><title>The Towers · Arquivo de campo</title></Head><FieldArchive /></>;
}
