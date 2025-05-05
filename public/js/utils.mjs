
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
