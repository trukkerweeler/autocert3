import { fetchAndParseXML } from './utils.mjs';

const btnSearch = document.getElementById("btnSearch");
const workOrderNo = document.getElementById("workOrderNo"); // Assuming this is the input field for Work Order No

btnSearch.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const workOrderNoValue = workOrderNo.value.trim(); // Get the value of the input field

    if (!workOrderNoValue) {
        console.error('Work Order No is empty');
        return;
    }

    try {
        const xmlResponse = await fetchXML(workOrderNoValue); // Fetch the XML data
        const parsedData = parseXML(xmlResponse); // Parse the fetched XML data
        // Handle the parsed data here
        console.log('Parsed Data:', parsedData);
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
        table.border = "1";

        const cert = { lines: [] }; // Initialize the cert object with an empty lines array

        details.forEach(detail => {
            const sections = detail.querySelectorAll("Section");
            sections.forEach(section => {
            const line = {}; // Create a new line object for each section

            const fields = section.querySelectorAll("Field");
            fields.forEach(field => {
                const name = field.getAttribute("Name");
                const formattedValue = field.querySelector("FormattedValue");
                const value = formattedValue ? formattedValue.textContent : "N/A";

                // Add the field to the line object
                if (name) {
                line[name] = value;
                }
            });

            // Add the line object to the cert's lines array
            cert.lines.push(line);
            });
        });

        console.log("Cert Object:", cert);
        // For each line we need to determine the category (material, weld, chem, paint, etc.)
        // For each line we need to determine 

        // document.body.appendChild(table); // Append the table to the body or a specific container
    } catch (error) {
        console.error('Error fetching or parsing XML:', error);
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
});
