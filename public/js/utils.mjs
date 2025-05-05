// Move fetchAndParseXML to a separate utils file
export function fetchAndParseXML(filePath, searchKey, searchValue) {
  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch the XML file.");
      }
      return response.text();
    })
    .then((xmlText) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      // Search for matching elements in the XML
      const elements = xmlDoc.getElementsByTagName(searchKey);
      let found = false;

      for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent === searchValue) {
          found = true;
          console.log("Match found:", elements[i].parentNode.outerHTML);
          break;
        }
      }

      if (!found) {
        console.log("No matching data found in the XML file.");
      }
    })
    .catch((error) => {
      console.error("Error processing XML:", error);
    });
}

// Get the certificate number from the XML file
export async function getCertNos(childWorkOrderNoValue) {
  const cert = { childlines: [] }; // Initialize the cert object with an empty lines array
  try {
    const workOrderNoValue = childWorkOrderNoValue.substring(0, 6); // Get the first 6 characters of the child WO value
    const xmlResponse = await fetchXML(workOrderNoValue); // Fetch the XML data
    const parsedData = parseXML(xmlResponse); // Parse the fetched XML data
    const crystalReport = parsedData.querySelector("CrystalReport");
    if (!crystalReport) {
      console.error("CrystalReport element not found in the parsed data.");
      return;
    }

    const details = crystalReport.querySelectorAll("Details");
    if (!details.length) {
      console.error("No Details elements found in the CrystalReport.");
      return;
    }

    const table = document.createElement("table");
    table.id = "xmlTable"; // Set an ID for the table if needed
    // table.border = "1";


    details.forEach((detail) => {
      const sections = detail.querySelectorAll("Section");
      sections.forEach((section) => {
        const line = {}; // Create a new line object for each section

        const fields = section.querySelectorAll("Field");
        fields.forEach((field) => {
          const name = field.getAttribute("Name");
          const formattedValue = field.querySelector("FormattedValue");
          const value = formattedValue ? formattedValue.textContent : "N/A";

          // Add the field to the line object
          if (name) {
            line[name] = value;
          }
        });
        let certno = line["SERIALNUMBER1"];
        // replace 'PO: ' with '' in certno
        certno = certno.replace("PO: ", "");
        // replace preceding zeros in certno
        certno = certno.replace(/^0+/, "");
        // if length is 5 or less, push to cert.lines array
        if (certno.length <= 5) {
          line["SERIALNUMBER1"] = certno; // Update the certno in the line object
            const isDuplicate = cert.childlines.some((existingLine) => {
            return JSON.stringify(existingLine) === JSON.stringify(line);
            });
            if (!isDuplicate) {
            cert.childlines.push(line);
            }
          return; // Skip to the next section
        } else {
          // push to lookup array
          cert.lookupchild = cert.lookupchild || []; // Initialize lookup array if not already done
          if (cert.lookupchild.length > 0) {
            const isDuplicate = cert.lookupchild.some((existingLine) => {
              return JSON.stringify(existingLine) === JSON.stringify(line);
            });
            if (!isDuplicate) {
              cert.lookupchild.push(line);
            }
          } 
        }
      });
    });
  } catch (error) {
    console.error("Error fetching or parsing XML:", error);
  }
  // Remove duplicates from cert.childlines, ignoring differences in 'QUANTITY1'
  cert.childlines = cert.childlines.filter((line, index, self) => 
    index === self.findIndex((t) => {
      const { QUANTITY1: _, ...restT } = t;
      const { QUANTITY1: __, ...restLine } = line;
      return JSON.stringify(restT) === JSON.stringify(restLine);
    })
  );
  return cert; // Return the cert object containing lines and lookup arrays
}

// Helper functions
async function fetchXML(workOrderNo) {
  const response = await fetch(`/data/${workOrderNo}.xml`);
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }
  return await response.text();
}

function parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        throw new Error('Error parsing XML');
    }
    return xmlDoc;
}

// Function to get details from the XML data
export async function getDetails(parsedData, childWorkOrderNoValue, workOrderNoValue) {
  const cert = { lines: [] }; // Initialize the cert object with an empty lines array
  try {
    const crystalReport = parsedData.querySelector("CrystalReport");
    if (!crystalReport) {
      console.error("CrystalReport element not found in the parsed data.");
      return;
    }

    const details = crystalReport.querySelectorAll("Details");
    if (!details.length) {
      console.error("No Details elements found in the CrystalReport.");
      return;
    }

    details.forEach((detail) => {
      const sections = detail.querySelectorAll("Section");
      sections.forEach((section) => {
        const line = {}; // Create a new line object for each section

        const fields = section.querySelectorAll("Field");
        fields.forEach((field) => {
          const name = field.getAttribute("Name");
          const formattedValue = field.querySelector("FormattedValue");
          const value = formattedValue ? formattedValue.textContent : "N/A";

          // Add the field to the line object
          if (name) {
            line[name] = value;
          }
        });
        let certno = line["SERIALNUMBER1"];
        // replace 'PO: ' with '' in certno
        certno = certno.replace("PO: ", "");
        // replace preceding zeros in certno
        certno = certno.replace(/^0+/, "");
        // if length is 5 or less, push to cert.lines array
        if (certno.length <= 5) {
          line["SERIALNUMBER1"] = certno; // Update the certno in the line object
          const isDuplicate = cert.lines.some((existingLine) => {
            return JSON.stringify(existingLine) === JSON.stringify(line);
          });
          if (!isDuplicate) {
            cert.lines.push(line);
          }
          return; // Skip to the next section
        } else {
          // push to lookup array
          cert.lookup = cert.lookup || []; // Initialize lookup array if not already done
          if (cert.lookup.length > 0) {
            const isDuplicate = cert.lookup.some((existingLine) => {
              return JSON.stringify(existingLine) === JSON.stringify(line);
            });
            if (!isDuplicate) {
              cert.lookup.push(line);
            }
          } 
        }
      });
    });
  } catch (error) {
    console.error("Error fetching or parsing XML:", error);
  }
  // Remove duplicates from cert.lines, ignoring differences in 'QUANTITY1'
  cert.lines = cert.lines.filter((line, index, self) => 
    index === self.findIndex((t) => {
      const { QUANTITY1: _, ...restT } = t;
      const { QUANTITY1: __, ...restLine } = line;
      return JSON.stringify(restT) === JSON.stringify(restLine);
    })
  );
  return cert; // Return the cert object containing lines and lookup arrays
}