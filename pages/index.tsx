// pages/index.tsx
import Head from "next/head";
import SearchInput from "../components/SearchInput";

const Home = () => {
  return (
    <div>
      <Head>
        <title>Yad2 Cars Search</title>
      </Head>
      <main>
        <h1>Search for Cars on Yad2</h1>
        <SearchInput />
      </main>
    </div>
  );
};

export default Home;
