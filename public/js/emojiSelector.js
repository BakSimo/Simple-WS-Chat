const emojiSelectorIcon = document.querySelector(".emoji-btn");
const emojiSelector = document.querySelector(".emoji-selector");
const emojiList = document.querySelector(".emoji-list");
const emojiInput = document.getElementById("emoji-input");

function emogiToggle() {
  emojiSelector.classList.toggle("active");
}

async function getEmojis() {
  await fetch(
    "https://emoji-api.com/emojis?access_key=4761dc65c2a4c6597aed5afae72bcefd6fe47817"
  )
    .then((response) => response.json())
    .then((data) => {
      loadEmoji(data);
    });
}

function loadEmoji(data) {
  for (let i = 0; i < Math.min(data.length, 50); i++) {
    let emoji = data[i];
    let li = document.createElement("li");
    li.setAttribute("emoji-name", emoji.slug);
    li.textContent = emoji.character;
    emojiList.appendChild(li);
  }
}

// function loadEmoji(data) {
//   data.forEach((emoji) => {
//     let li = document.createElement("li");
//     li.setAttribute("emoji-name", emoji.slug);
//     li.textContent = emoji.character;
//     emojiList.appendChild(li);
//   });
// }

emojiInput.addEventListener("keyup", (e) => {
  let value = e.target.value;
  let emogis = document.querySelectorAll(".emoji-list li");
  emogis.forEach((emoji) => {
    if (emoji.getAttribute("emoji-name").toLowerCase().includes(value)) {
      emoji.style.display = "flex";
    } else {
      emoji.style.display = "none";
    }
  });
});

document.addEventListener("DOMContentLoaded", getEmojis);
