import Head from "next/head";
import SearchInput from "../components/SearchInput";

const Home = () => {
  return (
    <div>
      <Head>
        <title>Yad2 Cars Search</title>
      </Head>
      <main className="main">
        <h1
          className="simply-center"
          style={{ marginBottom: "-0.25rem" }}
        >
          ?איזה מכונית בא לך לראות
        </h1>
        <h5 className="simply-center">נעשה לך חיפוש אוטו-מטי סטגדיש</h5>
        <SearchInput />
      </main>
    </div>
  );
};

export default Home;
