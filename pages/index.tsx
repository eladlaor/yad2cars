import Head from "next/head";
import SearchInput from "../components/SearchInput";

const Home = () => {
  return (
    <>
      <Head>
        <title>Yad2 Cars Search</title>
      </Head>
      <main>
        <h1>איזה מכוניות בא לך לראות?</h1>
        <h5>נעשה לך חיפוש אוטו-מטי סטגדיש</h5>
        <SearchInput />
      </main>
    </>
  );
};

export default Home;
