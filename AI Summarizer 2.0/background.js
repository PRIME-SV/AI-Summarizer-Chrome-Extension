
function getStorageValue(keyName) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keyName, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError); // Reject the promise if an error occurs
      } else {
        resolve(result[keyName]); // Resolve with the requested value
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize with AI",
    contexts: ["selection"]//, "page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  userApiKey = await getStorageValue("huggingFaceApiKey");
  if(userApiKey == undefined || userApiKey == null || userApiKey == '') {
    console.log("Invalid API key. Please provide valid key in the extension popup.");
  }

  if (info.menuItemId === "summarize") {
    const selectedText = info.selectionText || "";
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: summarizeText,
      args: [selectedText, userApiKey]
    });
  }
});


async function getChatGPTSummary(textToSummarize) {
  const apiKey = userApiKey; // Replace with your OpenAI API key
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use the model you have access to (e.g., gpt-4, gpt-3.5-turbo)
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes text concisely.",
          },
          {
            role: "user",
            content: `Please summarize the following text: ${textToSummarize}`,
          },
        ],
        max_tokens: 300, // Adjust depending on the desired summary length
        temperature: 0.7 // Adjust for creativity (lower = less creative, higher = more creative)
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();
    InduceUI(summary);
    return summary;
  } catch (error) {
    console.error("Error fetching summary:", error);
    return null;
  }
}

async function summarizeText(selectedText, userApiKey) {
  try {
        const apiKey = userApiKey;
        const endpoint = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";//"https://api.openai.com/v1/completions";
        const maxChunkSize = 3096; // Token limit for the model

        let text = selectedText ;//|| document.body.innerText;
        // Split text into chunks
        const chunks = [];
        while (text.length > 0) {
          const chunk = text.substring(0, maxChunkSize);
          console.log('chuck',chunk)
          chunks.push(chunk);
          text = text.substring(maxChunkSize);
        }

        const summaries = [];

        for (const chunk of chunks) {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
                    inputs: `${chunk}`,
                    parameters: {
                      "truncation": "do_not_truncate",
                      "clean_up_tokenization_spaces": "true"
                    }
                  })
          });

          const result = await response.json();
          if (result.error) {
            console.error("Error:", result.error);
            summaries.push('An error occured in the process. Please try again')
            return null;
          }
          summaries.push(result[0]?.summary_text || "No summary available.");
        }
        
        const summary = summaries.join(" ");
        console.log('Summary',summary);

        if (document.getElementById("induced-container"))
        {
          const container = document.getElementById("induced-container");
          container.remove();
        }

        if (!document.querySelector('#ai-summary-box')) {
          // Create a container div for the summary
          const container = document.createElement("div");
          container.id = "induced-container";
          container.style.position = "fixed";
          container.style.bottom = "10px";
          container.style.right = "0";
          container.style.width = "30%";
          container.style.maxHeight = "95vh";
          container.style.overflow = "hidden"; /* Prevent the entire container from scrolling */
          container.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          container.style.border = "1px solid #ccc";
          container.style.borderRadius = "10px 10px 10px 10px";
          container.style.backgroundColor = "white";
          container.style.zIndex = "10000";
          container.style.fontFamily = "Arial, sans-serif";
          container.style.display = "flex";
          container.style.flexDirection = "column";

          // Add the header
          const header = document.createElement("div");
          header.id = "induced-header";
          header.style.padding = "10px";
          header.style.backgroundColor = "#007BFF";
          header.style.color = "white";
          header.style.borderRadius = "10px 10px 0 0"; /* Match container's top corners */
          header.style.fontSize = "16px";
          header.style.fontWeight = "bold";
          header.style.display = "flex";
          header.style.justifyContent = "space-between";
          header.style.alignItems = "center";
          header.style.flexShrink = "0"; /* Prevent header from resizing */
          header.innerHTML = `
            <span>AI Summary</span>
            <button id="close-btn" style="background: none; border: none; color: white; font-size: 18px; font-weight: bold; cursor: pointer;">×</button>
          `;

          // Add the scrollable content area
          const content = document.createElement("div");
          content.id = "induced-content";
          content.style.padding = "10px";
          content.style.color = "#333";
          content.style.fontSize = "14px";
          content.style.lineHeight = "1.5";
          content.style.overflowY = "auto"; /* Enable vertical scrolling for the content */
          content.style.flexGrow = "1"; /* Allow the content to take up remaining space */
          content.textContent = summary;

          // Append header and content to the container
          container.appendChild(header);
          container.appendChild(content);

          // Append container to the body
          document.body.appendChild(container);

          // Close button functionality
          document.getElementById("close-btn").addEventListener("click", () => {
            container.remove();
          });
        }
  } catch (error) {
    console.error("Error summarizing background text:", error);
    alert("An error occurred while summarizing the text.");
  }
}

