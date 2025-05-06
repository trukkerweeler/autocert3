import { fetchXML, parseXML } from "./utils.mjs"; // Adjust the import path as necessary
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

    const cert = { lines: [] }; // Initialize the cert object with an empty lines array
    for (const detail of details) {
      const sections = detail.querySelectorAll("Section");
      for (const section of sections) {
        const line = {}; // Create a new line object for each section
      
        const fields = section.querySelectorAll("Field");
        for (const field of fields) {
          const name = field.getAttribute("Name");
          const formattedValue = field.querySelector("FormattedValue");
          const value = formattedValue ? formattedValue.textContent : "N/A";
      
          // Add the field to the line object
          if (name) {
            line[name] = value;
          }
        }
        let certno = line["SERIALNUMBER1"];
        // replace 'PO: ' with '' in certno
        certno = certno.replace("PO: ", "");
        // replace preceding zeros in certno
        certno = certno.replace(/^0+/, "");
        // if length is 5 or less, push to cert.lines array
        if (certno.length <= 5) {
          line["SERIALNUMBER1"] = certno; // Update the certno in the line object
            cert.lines.push(line);
        } else {













          let childWoNoValue = certno.substring(0, 6); // Update childWoNoValue with the new certno
          let childNo = certno.substring(7, 10); // Get the child number from the certno
          // console.log("Looking for:", childWoNoValue + '/' + childNo);

          // Function to process XML and extract matching SERIALNUMBER1 values
          async function processChildXML(childWoNoValue, childNo) {
            const childXmlResponse = await fetchXML(childWoNoValue);
            const childParsedData = parseXML(childXmlResponse);

            const childCrystalReport = childParsedData.querySelector("CrystalReport");
            if (!childCrystalReport) {
              console.error("Child CrystalReport element not found in the parsed data.");
              return [];
            }

            const childDetails = childCrystalReport.querySelectorAll("Details");
            if (!childDetails.length) {
              console.error("No Details elements found in the child CrystalReport.");
              return [];
            }

            const matchingSerialNumbers = []; // Initialize an array to store matching SERIALNUMBER1 values
            for (const childDetail of childDetails) {
              const childSections = childDetail.querySelectorAll("Section");
              for (const childSection of childSections) {
                const childLine = {}; // Create a new line object for each section
                const childFields = childSection.querySelectorAll("Field");

                for (const childField of childFields) {
                  const name = childField.getAttribute("Name");
                  const formattedValue = childField.querySelector("FormattedValue");
                  const value = formattedValue ? formattedValue.textContent : "N/A";

                  if (name) {
                    childLine[name] = value; // Add the field to the line object
                  }
                }
                let thisChildJob = childLine["JOB1"]
                let thisChildSuffix = childLine["SUFFIX1"]

                if ((thisChildSuffix === childNo) && (childWoNoValue === thisChildJob)) {
                  let serialNumber = childLine["SERIALNUMBER1"]; // Update the certno in the line object
                  serialNumber = serialNumber.replace("PO: ", "");
                  serialNumber = serialNumber.replace(/^0+/, "");
                  childLine["SERIALNUMBER1"] = serialNumber; // Update the certno in the line object

                  matchingSerialNumbers.push(childLine);
                }
              }
            }
            return matchingSerialNumbers;
          }

          const matchingSerialNumbers = await processChildXML(childWoNoValue, childNo);
          matchingSerialNumbers.forEach((serialNumber) => {
            if (!cert.lines.includes(serialNumber)) {
              cert.lines.push(serialNumber);
            } else {
              // console.log("Duplicate SERIALNUMBER1 found:", serialNumber);
              return;
            }
          });                   
        }
      }
    }
    // console.log("Cert Lines:", cert.lines); // Log the cert lines for debugging
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = ""; // Clear previous results

    // Create a table element
    const table = document.createElement("table");
    table.className = "results-table"; // Add a class for styling

    // Create the table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    if (cert.lines.length > 0) {
      const keys = Object.keys(cert.lines[0]); // Get the keys from the first line
      for (const key of keys) {
      const th = document.createElement("th");
      th.textContent = key; // Set the header text
      headerRow.appendChild(th);
      }
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the table body
    const tbody = document.createElement("tbody");
    for (const line of cert.lines) {
      const row = document.createElement("tr");
      for (const value of Object.values(line)) {
      const cell = document.createElement("td");
      cell.textContent = value; // Set the cell text
      row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    // Append the table to the results container
    searchResults.appendChild(table);
  
    const uniqueCerts = document.getElementById("uniqueCerts");
    uniqueCerts.innerHTML = ""; // Clear previous results
    const uniqueCertNos = new Set(); // Use a Set to store unique cert numbers
    for (const line of cert.lines) {
      const certno = line["SERIALNUMBER1"];
      uniqueCertNos.add(certno); // Add certno to the Set
    }
    const certNosString = Array.from(uniqueCertNos).join(" "); // Convert Set to string with spaces
    // console.log(certNosString); // Log the result
    uniqueCerts.textContent = certNosString; // Display the unique cert numbers in the element
    
  } catch (error) {
    console.error("Error fetching or parsing XML:", error);
  }
});

const btnPrintCerts = document.getElementById("btnPrintCerts");

btnPrintCerts.addEventListener("click", async function () {
  // alert("Not done yet!"); // Placeholder for the print functionality
  // return; // Exit the function if not done yet

  const uniqueCerts = document.getElementById("uniqueCerts").textContent.trim();
  if (!uniqueCerts) {
    console.error("No unique certs found to print.");
    return;
  }

  const certNumbers = uniqueCerts.split(" ");

  for (const certNumber of certNumbers) {
    const pdfPath = `http://FS1.CI.local/Common/Scans/Material_Process_Certs/${certNumber}.pdf`;
    console.log(`PDF Path: ${pdfPath}`); // Log the PDF path for debugging
    try {
      const response = await fetch(pdfPath, { method: "HEAD" }); // Use HEAD to check if the file exists
      if (!response.ok) {
        console.error(`PDF not found for cert number: ${certNumber} (HTTP ${response.status})`);
        continue;
      }cd

      const pdfResponse = await fetch(pdfPath); // Fetch the actual PDF if it exists
      if (!pdfResponse.ok) {
        console.error(`Failed to fetch PDF for cert number: ${certNumber}`);
        continue;
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);

      iframe.onload = function () {
        iframe.contentWindow.print();
        document.body.removeChild(iframe); // Clean up after printing
      };
    } catch (error) {
      console.error(`Error printing PDF for cert number: ${certNumber}`, error);
    }
  }
});