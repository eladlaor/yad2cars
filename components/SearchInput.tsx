import { useState } from "react";
import axios from "axios";
import { openInNewTab } from "../utils/navigation";

const SearchInput = () => {
  const [inputText, setInputText] = useState("");

  const handleSearch = async () => {
    try {
      const response = await axios.post("/api/generateSearchParams", {
        inputText,
      });
      const { searchUrl } = response.data;

      openInNewTab(searchUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your search query in Hebrew..."
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchInput;
