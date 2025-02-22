document.getElementById("save-btn").addEventListener("click", () => {
  const apiKey = document.getElementById("apikey").value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (!apiKey) {
    errorMsg.textContent = "API key cannot be empty.";
    return;
  }

  // Store the API key in Chrome storage
  chrome.storage.sync.set({ huggingFaceApiKey: apiKey }, () => {
    errorMsg.textContent = "";
    alert("API key saved successfully!");
  });
});

// Pre-fill the input if an API key already exists
chrome.storage.sync.get("huggingFaceApiKey", (data) => {
  if (data.huggingFaceApiKey) {
    document.getElementById("apikey").value = data.huggingFaceApiKey;
  }
});
