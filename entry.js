const title = document.querySelector("[data-split-text]");

if (title) {
  let wordIndex = 0;
  for (const node of [...title.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const fragment = document.createDocumentFragment();
    const parts = node.textContent.split(/(\s+)/);
    for (const part of parts) {
      if (!part.trim()) {
        fragment.append(part);
        continue;
      }
      const word = document.createElement("span");
      word.className = "split-word";
      word.style.setProperty("--word-index", wordIndex);
      word.textContent = part;
      fragment.append(word);
      wordIndex += 1;
    }
    node.replaceWith(fragment);
  }
}
