const SearchResults = ({ searchResult }: { searchResult: any }) => {
  return (
    <div>
      <p>Search Result:</p>
      <div dangerouslySetInnerHTML={{ __html: searchResult }}></div>
    </div>
  );
};

export default SearchResults;
