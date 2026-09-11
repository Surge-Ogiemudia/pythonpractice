import { Problem } from "@/types";

export const CS50_PROBLEMS: Problem[] = [
  {
    id: "fuel",
    title: "Fuel Gauge",
    week: "Week 3: Exceptions",
    filename: "fuel.py",
    description: `Fuel gauges indicate, often with fractions, just how much fuel is in a tank. For instance 1/4 indicates that a tank is 25% full, 1/2 indicates that a tank is 50% full, and 3/4 indicates that a tank is 75% full.

In a file called fuel.py, implement a program that prompts the user for a fraction, formatted as X/Y, wherein X is a non-negative integer and Y is a positive integer, and then outputs, as a percentage rounded to the nearest integer, how much fuel is in the tank. If, though, 1% or less remains, output E instead to indicate that the tank is essentially empty. And if 99% or more remains, output F instead to indicate that the tank is essentially full.

If, though, X or Y is not an integer, X is greater than Y, or Y is 0, instead prompt the user again. (It is not necessary for Y to be 4.) Be sure to catch any exceptions like ValueError or ZeroDivisionError.`,
    requirements: [
      "Prompt user for fraction formatted as X/Y",
      "X must be non-negative integer (X >= 0) and Y must be positive integer (Y > 0)",
      "Output fuel as rounded percentage (e.g., 75%, 25%)",
      "If rounded percentage <= 1%, output 'E'",
      "If rounded percentage >= 99%, output 'F'",
      "If X or Y is not an integer, X > Y, or Y is 0, prompt again repeatedly in a loop",
      "Catch ValueError and ZeroDivisionError"
    ],
    expectedEdgeCases: [
      "Catch ValueError if X or Y is text (e.g. 'three/four') or decimal (e.g. '1.5/3')",
      "Catch ZeroDivisionError or reject when Y == 0 (e.g. '4/0')",
      "Prompt again if X > Y (e.g. '5/4')",
      "Prompt again if X is negative (e.g. '-3/4')",
      "Treat 0/4 as 0% which outputs 'E'",
      "Treat 4/4 as 100% which outputs 'F'",
      "Output no space between number and '%' (e.g. '75%')"
    ],
    hints: [
      "Use str.split('/') to unpack into two strings.",
      "Wrap string conversions and division inside try / except (ValueError, ZeroDivisionError).",
      "Inside while True, use continue to re-prompt on invalid inputs.",
      "Use round((x / y) * 100) to compute percentage.",
      "Use print(f'{percentage}%') to avoid spaces."
    ],
    testCases: [
      { input: "3/4", expectedOutput: "75%", description: "Valid middle fraction" },
      { input: "1/4", expectedOutput: "25%", description: "Valid lower fraction" },
      { input: "4/4", expectedOutput: "F", description: "Full tank (100% -> F)" },
      { input: "0/4", expectedOutput: "E", description: "Empty tank (0% -> E)" },
      { input: "99/100", expectedOutput: "F", description: "Near full (>= 99% -> F)" },
      { input: "1/100", expectedOutput: "E", description: "Near empty (<= 1% -> E)" }
    ],
    defaultAtomicSteps: [
      "Prompt the user for fraction string formatted as 'X/Y'",
      "Split fraction across '/' into x and y parts and convert both to integers",
      "Check if x > y or x < 0 or y <= 0, and if so reprompt/continue",
      "Calculate rounded percentage: round((x / y) * 100)",
      "If percentage <= 1 output 'E', elif percentage >= 99 output 'F', else output '{percentage}%'"
    ]
  },
  {
    id: "taqueria",
    title: "Felipe's Taqueria",
    week: "Week 3: Exceptions",
    filename: "taqueria.py",
    description: `One of the most popular places to eat in Harvard Square is Felipe's Taqueria, which offers a menu of Mexican food.
In a file called taqueria.py, implement a program that enables a user to place an order, prompting them for items, one per line, until the user inputs control-d. After each inputted item, display the total cost of all items inputted thus far, prefixed with a dollar sign ($) and formatted to two decimal places. Treat the user's input case-insensitively. Ignore any input that isn't an item on the menu.`,
    requirements: [
      "Maintain a menu dictionary with item prices as floats",
      "Prompt user for items one per line in a loop",
      "Display running total formatted to 2 decimal places ($XX.XX)",
      "Input is case-insensitive (titlecase)",
      "Ignore any input not on the menu without crashing",
      "Catch EOFError (control-d) to end the program cleanly"
    ],
    expectedEdgeCases: [
      "Catch EOFError when user presses Ctrl-D / inputs end-of-file",
      "Format total as $XX.XX using f'${total:.2f}'",
      "Case-insensitivity: 'burrito', 'Burrito', 'BURRITO' should all match",
      "Non-menu items should be silently ignored (or re-prompted without changing total)"
    ],
    hints: [
      "Use dict.title() or match against titlecased menu keys.",
      "Wrap the input() call in try / except EOFError: break.",
      "Keep a cumulative float total initialized to 0.0."
    ],
    testCases: [
      { input: "Taco\nBurrito\n", expectedOutput: "$10.50", description: "Two menu items" },
      { input: "burger\nTaco\n", expectedOutput: "$3.00", description: "Ignore invalid item" }
    ],
    defaultAtomicSteps: [
      "Define menu dictionary with items and their float prices",
      "Initialize running total variable to 0.0",
      "Start infinite while True loop and prompt user for item inside try block",
      "Handle EOFError (Ctrl-D) by printing newline and breaking the loop",
      "Titlecase input and check if item exists in menu; if so, add price to total and print formatted total"
    ]
  },
  {
    id: "coke",
    title: "Coke Machine",
    week: "Week 2: Loops",
    filename: "coke.py",
    description: `Suppose that a machine sells bottles of Coca-Cola for 50 cents and only accepts coins in these denominations: 25 cents, 10 cents, and 5 cents.
In a file called coke.py, implement a program that prompts the user to insert a coin, one at a time, each time informing the user of the amount due. Once the user has inputted at least 50 cents, output how many cents in change the user is owed. Assume that the user will only input integers, and ignore any integer that isn't an accepted denomination.`,
    requirements: [
      "Bottle costs 50 cents",
      "Only accept coins of 25, 10, or 5 cents",
      "Prompt user repeatedly while amount due > 0",
      "Display 'Amount Due: X'",
      "Ignore any coin not in [25, 10, 5] without reducing amount due",
      "Once 50 cents or more is paid, output 'Change Owed: Y'"
    ],
    expectedEdgeCases: [
      "Ignore invalid coins like 1, 20, 50, etc.",
      "Calculate change correctly if user pays more than 50 cents (e.g. 25 + 25 + 25 = 25 change)",
      "When exactly 50 cents paid, Change Owed: 0"
    ],
    hints: [
      "Maintain amount_due = 50.",
      "Check: if coin in [25, 10, 5]: amount_due -= coin.",
      "Loop until amount_due <= 0, then calculate abs(amount_due) as change."
    ],
    testCases: [
      { input: "25\n25\n", expectedOutput: "Change Owed: 0", description: "Exact payment (25 + 25)" },
      { input: "25\n10\n25\n", expectedOutput: "Change Owed: 10", description: "Overpayment (25 + 10 + 25 = 60)" },
      { input: "30\n25\n25\n", expectedOutput: "Change Owed: 0", description: "Ignore 30 cent coin" }
    ],
    defaultAtomicSteps: [
      "Set amount_due = 50",
      "Start loop while amount_due > 0",
      "Print 'Amount Due: {amount_due}' and prompt for coin integer",
      "Check if coin in [25, 10, 5]; if so, subtract coin from amount_due",
      "After loop ends, calculate and print 'Change Owed: {abs(amount_due)}'"
    ]
  },
  {
    id: "plates",
    title: "Vanity Plates",
    week: "Week 2: Loops",
    filename: "plates.py",
    description: `In Massachusetts, home to Harvard University, it's possible to request a vanity license plate for your car.
Requirements:
- Must start with at least two letters.
- Must contain a maximum of 6 characters and a minimum of 2 characters.
- Numbers cannot be used in the middle of a plate; they must come at the end. For example, AAA222 would be an acceptable vanity plate; AAA22A would not be acceptable.
- The first number used cannot be a '0'.
- No periods, spaces, or punctuation marks are allowed.`,
    requirements: [
      "Length between 2 and 6 characters",
      "Starts with at least two letters",
      "Numbers must only appear at the end",
      "The first number used cannot be '0'",
      "All characters must be alphanumeric (no punctuation or spaces)"
    ],
    expectedEdgeCases: [
      "First number is '0' (e.g., 'CS05' -> Invalid)",
      "Letters after numbers (e.g., 'CS50P' -> Invalid)",
      "Less than 2 letters at start (e.g., 'C5' or '50' -> Invalid)",
      "Punctuation/spaces (e.g., 'PI3.14' -> Invalid)"
    ],
    hints: [
      "Check s.isalnum() and 2 <= len(s) <= 6.",
      "Check s[0].isalpha() and s[1].isalpha().",
      "Iterate through characters: once a digit is seen, ensure it's not '0' on first sight, and all subsequent chars must be digits."
    ],
    testCases: [
      { input: "CS50", expectedOutput: "Valid", description: "Standard valid plate" },
      { input: "CS05", expectedOutput: "Invalid", description: "First number is zero" },
      { input: "CS50P", expectedOutput: "Invalid", description: "Letter after numbers" },
      { input: "PI3.14", expectedOutput: "Invalid", description: "Punctuation not allowed" },
      { input: "H", expectedOutput: "Invalid", description: "Too short" },
      { input: "OUTATIME", expectedOutput: "Invalid", description: "Too long" }
    ],
    defaultAtomicSteps: [
      "Define is_valid(s) function and main() to prompt user and print Valid/Invalid",
      "Check length constraint: 2 <= len(s) <= 6 and s.isalnum()",
      "Check first two characters are letters: s[0:2].isalpha()",
      "Scan characters for numbers: ensure first digit is not '0', and no letters appear after a digit",
      "Return True if all rules passed, otherwise False"
    ]
  },
  {
    id: "twttr",
    title: "Just setting up my twttr",
    week: "Week 2: Loops",
    filename: "twttr.py",
    description: `When texting or tweeting, it's not uncommon to shorten words to save time or space, by omitting vowels.
In a file called twttr.py, implement a program that prompts the user for a str of text and then outputs that same text but with all vowels (A, E, I, O, and U) omitted, whether inputted in uppercase or lowercase.`,
    requirements: [
      "Prompt user for string input",
      "Remove all vowels (A, E, I, O, U) case-insensitively",
      "Preserve casing of consonants and all numbers/punctuation",
      "Output the modified text"
    ],
    expectedEdgeCases: [
      "Handle both upper and lower case vowels: 'a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'",
      "Keep consonants unchanged (e.g. 'Twitter' -> 'Twttr')",
      "Keep numbers and punctuation intact (e.g. 'CS50!' -> 'CS50!')"
    ],
    hints: [
      "Define vowels = 'aeiouAEIOU'.",
      "Loop through each character in the string.",
      "If character not in vowels, append it or print(char, end='')."
    ],
    testCases: [
      { input: "Twitter", expectedOutput: "Twttr", description: "Standard word" },
      { input: "What's your name?", expectedOutput: "Wht's yr nm?", description: "Sentence with punctuation" },
      { input: "CS50", expectedOutput: "CS50", description: "Consonants and numbers" }
    ],
    defaultAtomicSteps: [
      "Prompt user for input string",
      "Define list or string of vowels: 'aeiouAEIOU'",
      "Iterate through each character in the input string",
      "If char is in vowels skip it, otherwise append or print with end=''",
      "Print newline at the end"
    ]
  }
];
