/**
 * Simple CSV Helper for Academic Calendar
 */

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data 
 * @returns {string}
 */
export const jsonToCsv = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

/**
 * Parses a CSV string to an array of objects.
 * @param {string} csvText 
 * @returns {Array<Object>}
 */
export const csvToJson = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma but ignore commas inside quotes
    if (currentLine.length !== headers.length) continue;
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = currentLine[j].trim();
      val = val.replace(/^"|"$/g, '').replace(/""/g, '"'); // Remove quotes and unescape
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  
  return result;
};

/**
 * Triggers a browser download for a CSV file.
 * @param {string} csvContent 
 * @param {string} fileName 
 */
export const downloadCsv = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
