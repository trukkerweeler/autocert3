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
      sections.forEach(async (section) => {
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
          cert.lines.push(certno);
        } else {
          // console.log("Cert No is greater than 5 characters:", certno);
          let childWoNoValue = certno.substring(0, 6); // Update childWoNoValue with the new certno
          // console.log("Child Work Order No:", childWoNoValue); // Log the child work order number for debugging
          let childNo = certno.substring(7, 10); // Get the child number from the certno
          // console.log("Child No:", childNo); // Log the child number for debugging

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
                const childFields = childSection.querySelectorAll("Field");
                let serialNumber = null;
                let suffix = null;

                for (const childField of childFields) {
                  const name = childField.getAttribute("Name");
                  const formattedValue = childField.querySelector("FormattedValue");
                  const value = formattedValue ? formattedValue.textContent : "N/A";

                  if (name === "SERIALNUMBER1") {
                    serialNumber = value;
                  } else if (name === "SUFFIX1") {
                    suffix = value;
                  }
                }

                // Check if SUFFIX1 matches childNo
                if (suffix === childNo && serialNumber) {
                  // Replace 'PO: ' with '' in serialNumber
                  serialNumber = serialNumber.replace("PO: ", "");
                  // Replace preceding zeros in serialNumber
                  serialNumber = serialNumber.replace(/^0+/, "");
                  matchingSerialNumbers.push(serialNumber);
                }
              }
            }

            return matchingSerialNumbers;
          }

          // Use the refactored function
          const matchingSerialNumbers = await processChildXML(childWoNoValue, childNo);
          // console.log("Matching SERIALNUMBER1 values:", matchingSerialNumbers);
          // Add the matching serial numbers to the cert.lines array if they are not already present
          matchingSerialNumbers.forEach((serialNumber) => {
            if (!cert.lines.includes(serialNumber)) {
              cert.lines.push(serialNumber);
            } else {
              // console.log("Duplicate SERIALNUMBER1 found:", serialNumber);
              return;
            }
          });                   
        }
      });
    }
    console.log("Cert Lines:", cert.lines); // Log the cert lines for debugging
  } catch (error) {
    console.error("Error fetching or parsing XML:", error);
  }
});
