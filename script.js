const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const memoryIndicator = document.querySelector("#memory-indicator");
const keypad = document.querySelector(".keypad");

let expression = "";
let memory = null;
let justCalculated = false;

function tokenize(input) {
  const tokens = input.match(/\d*\.?\d+|[()+\-*/%]/g) ?? [];
  if (tokens.join("") !== input.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }
  return tokens;
}

function evaluate(input) {
  const tokens = tokenize(input);
  let position = 0;

  function parseExpression() {
    let value = parseTerm();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = parseUnary();
      if (operator === "/" && right === 0) {
        throw new Error("Cannot divide by zero");
      }
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseUnary() {
    if (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const value = parseUnary();
      return operator === "-" ? -value : value;
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (tokens[position] === "%") {
      position += 1;
      value /= 100;
    }
    return value;
  }

  function parsePrimary() {
    const token = tokens[position++];
    if (token === "(") {
      const value = parseExpression();
      if (tokens[position++] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      return value;
    }
    if (token === undefined || !/^\d*\.?\d+$/.test(token)) {
      throw new Error("Incomplete expression");
    }
    return Number(token);
  }

  if (tokens.length === 0) {
    throw new Error("Enter an expression");
  }

  const value = parseExpression();
  if (position !== tokens.length) {
    throw new Error("Incomplete expression");
  }
  if (!Number.isFinite(value)) {
    throw new Error("Result is out of range");
  }
  return Number(value.toPrecision(12));
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 10,
  }).format(value);
}

function currentValue() {
  if (!expression) return 0;
  return evaluate(expression);
}

function render() {
  expressionDisplay.textContent = expression
    .replaceAll("*", "×")
    .replaceAll("/", "÷")
    .replaceAll("-", "−");
  resultDisplay.classList.remove("is-error");

  if (!expression) {
    resultDisplay.textContent = "0";
    return;
  }

  try {
    resultDisplay.textContent = formatNumber(currentValue());
  } catch {
    resultDisplay.textContent = "…";
  }
}

function showError(message) {
  resultDisplay.textContent = message;
  resultDisplay.classList.add("is-error");
}

function appendValue(value) {
  if (justCalculated && /[\d.(]/.test(value)) {
    expression = "";
  }
  justCalculated = false;

  const last = expression.at(-1);
  if (/^\d$/.test(value)) {
    if (last === ")" || last === "%") expression += "*";
    expression += value;
  } else if (value === ".") {
    if (last === ")" || last === "%") {
      expression += "*0.";
    } else {
      const currentNumber = expression.match(/(?:^|[()+\-*/])(\d*\.?\d*)$/)?.[1] ?? "";
      if (!currentNumber.includes(".")) {
        expression += /\d$/.test(last ?? "") ? "." : "0.";
      }
    }
  } else if (value === "(") {
    if (last && /[\d)%]/.test(last)) expression += "*";
    expression += value;
  } else if (value === ")") {
    const openCount = (expression.match(/\(/g) ?? []).length;
    const closeCount = (expression.match(/\)/g) ?? []).length;
    if (openCount > closeCount && last && /[\d)%]/.test(last)) expression += value;
  } else if (value === "%") {
    if (last && /[\d)%]/.test(last)) expression += value;
  } else if (/^[+\-*/]$/.test(value)) {
    if (!expression && value !== "-") return;
    if (/[+\-*/]$/.test(last ?? "")) {
      expression = expression.slice(0, -1) + value;
    } else if (last !== "(") {
      expression += value;
    } else if (value === "-") {
      expression += value;
    }
  }
  render();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
  } else {
    try {
      expression = String(-currentValue());
      justCalculated = false;
    } catch {
      if (/[+\-*/]$/.test(expression)) {
        expression += "-";
      } else {
        expression = `-(${expression})`;
      }
    }
  }
  render();
}

function backspace() {
  if (justCalculated) {
    expression = "";
    justCalculated = false;
  } else {
    expression = expression.slice(0, -1);
  }
  render();
}

function calculate() {
  try {
    const value = currentValue();
    expression = String(value);
    justCalculated = true;
    render();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Invalid expression");
  }
}

function updateMemoryIndicator() {
  const hasMemory = memory !== null;
  memoryIndicator.classList.toggle("is-active", hasMemory);
  memoryIndicator.setAttribute("aria-label", hasMemory ? "Memory contains a value" : "Memory is empty");
}

function handleMemory(action) {
  if (action === "memory-clear") {
    memory = null;
  } else if (action === "memory-recall") {
    if (memory !== null) {
      expression = String(memory);
      justCalculated = false;
      render();
    }
  } else {
    try {
      const value = currentValue();
      memory = action === "memory-add"
        ? (memory ?? 0) + value
        : (memory ?? 0) - value;
      memory = Number(memory.toPrecision(12));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Invalid expression");
      return;
    }
  }
  updateMemoryIndicator();
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action?.startsWith("memory-")) {
    handleMemory(button.dataset.action);
    return;
  }

  switch (button.dataset.action) {
    case "clear":
      expression = "";
      justCalculated = false;
      render();
      break;
    case "backspace":
      backspace();
      break;
    case "sign":
      toggleSign();
      break;
    case "equals":
      calculate();
      break;
    default:
      if (button.dataset.value) appendValue(button.dataset.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key) || ["+", "-", "*", "/", ".", "(", ")", "%"].includes(event.key)) {
    event.preventDefault();
    appendValue(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (event.key === "Escape" || event.key === "Delete") {
    expression = "";
    justCalculated = false;
    render();
  }
});

render();
updateMemoryIndicator();
