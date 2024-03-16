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
  for (let i = 0; i < Math.min(data.length, 49); i++) {
    let emoji = data[i];
    let li = document.createElement("li");
    li.setAttribute("emoji-name", emoji.slug);
    li.textContent = emoji.character;
    emojiList.appendChild(li);

    li.addEventListener("click", function () {
      var input = document.getElementById("msg-input");
      insertAtCursor(input, emoji.character);
    });
  }
}

function insertAtCursor(myField, myValue) {
  if (document.selection) {
    myField.focus();
    var sel = document.selection.createRange();
    sel.text = myValue;
  } else if (myField.selectionStart || myField.selectionStart == "0") {
    var startPos = myField.selectionStart;
    var endPos = myField.selectionEnd;
    myField.value =
      myField.value.substring(0, startPos) +
      myValue +
      myField.value.substring(endPos, myField.value.length);
    myField.selectionStart = startPos + myValue.length;
    myField.selectionEnd = startPos + myValue.length;
  } else {
    myField.value += myValue;
  }
}

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
