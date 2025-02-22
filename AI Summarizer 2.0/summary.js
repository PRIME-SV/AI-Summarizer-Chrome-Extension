window.onload = function() {
    chrome.storage.local.get("summary", (data) => {
        const summary = data.summary || "No summary available.";
        document.getElementById("summary-output").textContent = summary;
    });
    // const urlParams = new URLSearchParams(window.location.search);
    // const customText = urlParams.get('text');
    // if (customText) {
    //   document.getElementById('customMessage').innerText = customText;
    // }
  };