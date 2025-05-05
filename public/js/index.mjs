import { fetchAndParseXML, getDetails } from "./utils.mjs";

const btnSearch = document.getElementById("btnSearch");
const workOrderNo = document.getElementById("workOrderNo"); // Assuming this is the input field for Work Order No

btnSearch.addEventListener("click", async function (event) {
  event.preventDefault(); // Prevent the default form submission

  const workOrderNoValue = workOrderNo.value.trim(); // Get the value of the input field

  if (!workOrderNoValue) {
    console.error("Work Order No is empty");
    return;
  }

  try {
    const xmlResponse = await fetchXML(workOrderNoValue); // Fetch the XML data
    const parsedData = parseXML(xmlResponse); // Parse the fetched XML data
    // Handle the parsed data here
    // console.log("Parsed Data:", parsedData);
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

    const cert = { lines: [] }; // Initialize the cert object with an empty lines array

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
          line["SERIALNUMBER1"] = certno;
          cert.lines.push(line);
          return; // Skip to the next section
        } else {
          // push to lookup array
          cert.lookup = cert.lookup || []; // Initialize lookup array if not already done
          cert.lookup.push(line);
        }
      });
    });

    // console.log("Cert Object:", cert.lines);
    console.log("Cert Object:", cert);
    // log all of the unique lines[SERIALNUMBER1] in cert.lines
    // const uniqueLines = cert.lines.reduce((acc, line) => {
    //   let certno = line["SERIALNUMBER1"];
    //   if (certno) {
    //     certno = certno.trim(); // Ensure consistent formatting
    //     if (!acc.includes(certno)) {
    //       acc.push(certno);
    //     }
    //   }
    //   return acc;
    // }, []);
    // console.log("Unique Lines:", uniqueLines);

    const lookupsDetails = { lines: [] };
    // For each line in cert.lookup, get cert data from the workorder
    cert.lookup.forEach((line) => {
      let childWoNo = line["SERIALNUMBER1"];
      let lookupCertNo = childWoNo.substring(0, 6); // Get the first 6 characters of the certno
      let lookupCertNoChild = childWoNo.substring(
        childWoNo.length - 3,
        childWoNo.length
      );
      //   console.log("Lookup Cert No:", lookupCertNo);
      //   console.log("Lookup Cert No Child:", lookupCertNoChild);
      // Fetch the cert data using the lookupCertNo
      fetchXML(lookupCertNo)
        .then((lookupResponse) => {
          const lookupParsedData = parseXML(lookupResponse);
          // Handle the lookup parsed data here
          //   console.log("Lookup Parsed Data:", lookupParsedData);
          const lookupCrystalReport =
            lookupParsedData.querySelector("CrystalReport");
          if (!lookupCrystalReport) {
            console.error(
              "CrystalReport element not found in the lookup parsed data."
            );
            return;
          }
          const lookupDetails = lookupCrystalReport.querySelectorAll("Details");
          if (!lookupDetails.length) {
            console.error(
              "No Details elements found in the lookup CrystalReport."
            );
            return;
          }
          lookupDetails.forEach((lookupDetail) => {
            const lookupSections = lookupDetail.querySelectorAll("Section");
            lookupSections.forEach((lookupSection) => {
              const lookupLine = {}; // Create a new line object for each section

              const lookupFields = lookupSection.querySelectorAll("Field");
              lookupFields.forEach((lookupField) => {
                const name = lookupField.getAttribute("Name");
                const formattedValue =
                  lookupField.querySelector("FormattedValue");
                const value = formattedValue
                  ? formattedValue.textContent
                  : "N/A";

                // Add the field to the line object
                if (name) {
                  lookupLine[name] = value;
                }
              });
              let certno = lookupLine["SERIALNUMBER1"];
              // replace 'PO: ' with '' in certno
              certno = certno.replace("PO: ", "");
              // replace preceding zeros in certno
              certno = certno.replace(/^0+/, "");
              // if length is 5 or less, push to lookupsDetails.lines array
              if (certno.length <= 5) {
                lookupLine["SERIALNUMBER1"] = certno; // Update the certno in the line object
                // Check if a similar line already exists in lookupsDetails.lines (ignoring QUANTITY1)
                const isDuplicate = lookupsDetails.lines.some(
                  (existingLine) => {
                    return Object.keys(lookupLine).every((key) => {
                      if (key === "QUANTITY1") return true; // Ignore QUANTITY1 field
                      return existingLine[key] === lookupLine[key];
                    });
                  }
                );

                // If not a duplicate, push the line to lookupsDetails.lines
                if (!isDuplicate) {
                  lookupsDetails.lines.push(lookupLine);
                  cert.lines.push(lookupLine); // Add to cert.lines as well
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error("Error fetching or parsing lookup XML:", error);
        });
    });

    // //   log all of the unique lines[SERIALNUMBER1] in cert.lines
    // const uniqueLines = cert.lines.reduce((acc, line) => {
    //   const certno = line["SERIALNUMBER1"];
    //   if (!acc.includes(certno)) {
    //     acc.push(certno);
    //   }
    //   return acc;
    // }, []);
    // console.log("Unique Lines:", uniqueLines);

    // console.log("Lines:", cert.lines);
    // Create a table from cert.lines and append it to the document
    const tableHeaders = Object.keys(cert.lines[0] || {}); // Get the headers from the first line

    if (tableHeaders.length > 0) {
      // Create the table header row
      const headerRow = document.createElement("tr");
      tableHeaders.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
      });

      table.appendChild(headerRow);

      // Create the table rows for each line
      cert.lines.forEach((line) => {
        const row = document.createElement("tr");
        tableHeaders.forEach((header) => {
          const td = document.createElement("td");
          td.textContent = line[header] || ""; // Fill with empty string if value is missing
          row.appendChild(td);
        });
        table.appendChild(row);
      });

      // Append the table to the document body or a specific container
      const container = document.getElementById("tableContainer") || document.body;
      container.appendChild(table);
    } else {
      console.error("No data available to create the table.");
    }


  } catch (error) {
    console.error("Error fetching or parsing XML:", error);
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
      throw new Error("Error parsing XML");
    }
    return xmlDoc;
  }
});
