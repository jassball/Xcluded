function removeMentions() {
    let elements = document.querySelectorAll("body, body *:not(script):not(style):not(iframe)");

    elements.forEach(element => {
        if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) { // Only text nodes
            let text = element.childNodes[0].nodeValue;
            let replacedText = text.replace(/\b(Trump|Musk)\b/gi, "*****");
            
            if (replacedText !== text) {
                element.childNodes[0].nodeValue = replacedText;
            }
        }
    });
}

// Run on initial load
removeMentions();

// Run on dynamic content changes
const observer = new MutationObserver(removeMentions);
observer.observe(document.body, { childList: true, subtree: true });
