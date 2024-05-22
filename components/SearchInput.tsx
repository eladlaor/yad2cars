import { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from "react-bootstrap";

export default function SearchInput() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await axios.post("/api/generateSearchUrl", {
        inputText,
      });
      const { searchUrl } = response.data;

      window.open(searchUrl, "_blank");
    } catch (error: any) {
      console.error(error);
      setError(
        error?.response?.data?.error ||
          error?.message ||
          "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      {error && (
        <div className="custom-alert">
          {error}
          <button
            className="close-btn"
            onClick={() => setError("")}
          >
            Close
          </button>
        </div>
      )}{" "}
      <Form.Group controlId="searchText">
        <Form.Control
          as="textarea"
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="אפשר לציין סוגי רכב, יצרנים, שנים ומחירים..."
        />
      </Form.Group>
      <Button
        variant="primary"
        onClick={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? "מתניע, אוטוטו מוצא..." : "חיפוש"}
      </Button>
    </Container>
  );
}
