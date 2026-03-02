import React, { useState } from "react";

const DataTable = ({
  columns,
  data,
  rowsPerPage = 5,
  emptyMessage = "No data available",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key]
      ? a[sortConfig.key].toString().toLowerCase()
      : "";
    const valB = b[sortConfig.key]
      ? b[sortConfig.key].toString().toLowerCase()
      : "";
    if (valA < valB) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (data.length === 0) {
    return (
      <div className="no-data" style={{ textAlign: "center", padding: "20px" }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                onClick={() => col.sortable && handleSort(col.accessor)}
                style={{ cursor: col.sortable ? "pointer" : "default" }}
              >
                {col.header}{" "}
                {col.sortable && sortConfig.key === col.accessor && (
                  <span>
                    {sortConfig.direction === "ascending" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIndex) => (
            <tr key={row._id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div
          className="pagination"
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              marginRight: "10px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              marginLeft: "10px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
