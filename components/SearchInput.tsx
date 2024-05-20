import { useState } from "react";
import axios from "axios";
import { openInNewTab } from "../utils/navigation";
import { Container, Form, Button } from "react-bootstrap";

const SearchInput = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/generateSearchParams", {
        inputText,
      });
      const { searchUrl } = response.data;

      openInNewTab(searchUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="simply-center">
      <div className="textarea-container">
        <Form.Group controlId="searchText">
          <Form.Control
            as="textarea"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="אפשר לציין סוגי רכב, יצרנים, שנים ומחירים..."
            dir="rtl"
          />
        </Form.Group>
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? "מתניע..." : "חיפוש"}
        </Button>
      </div>
    </Container>
  );
};

export default SearchInput;
