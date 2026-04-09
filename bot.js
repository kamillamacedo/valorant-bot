const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const responses = {
  hello: "Hi there! How can I help you?",
  hi: "Hey! What can I do for you?",
  help: "I can answer basic questions. Try asking me something!",
  bye: "Goodbye! Have a great day!",
  default: "I'm not sure how to respond to that. Try saying 'help'.",
};

function getResponse(input) {
  const key = input.trim().toLowerCase();
  return responses[key] || responses.default;
}

function chat() {
  rl.question("You: ", (input) => {
    if (!input) {
      chat();
      return;
    }

    const reply = getResponse(input);
    console.log(`Bot: ${reply}`);

    if (input.trim().toLowerCase() === "bye") {
      rl.close();
      return;
    }

    chat();
  });
}

console.log("Bot is running. Type 'bye' to exit.");
chat();
