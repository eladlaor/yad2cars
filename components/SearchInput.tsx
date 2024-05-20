// components/SearchInput.tsx
import { useState } from "react";
import axios from "axios";

const SearchInput = () => {
  const [inputText, setInputText] = useState("");

  const handleSearch = async () => {
    try {
      const response = await axios.post("/api/generateSearchParams", {
        inputText,
      });
      const { searchUrl } = response.data;

      // Open the generated URL in a new tab
      window.open(searchUrl, "_blank");
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
