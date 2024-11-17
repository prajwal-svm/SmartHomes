// Test Case 1.1
{
    description: "The TV arrived with a completely shattered screen. The box was crushed and I would like a refund please. This is unacceptable.",
    expectedOutput: "1"  // Clear severe damage >10% + explicit refund request
}

// Test Case 1.2
{
    description: "Package arrived destroyed and the laptop inside is broken into pieces. I want my money back immediately.",
    expectedOutput: "1"  // Catastrophic damage >10% + demanding refund
}

// Test Case 2.1
{
    description: "My microwave arrived with the door completely broken off and won't turn on. Can you send a new one?",
    expectedOutput: "2"  // Significant damage >10% + requesting replacement
}

// Test Case 2.2
{
    description: "The chair arrived with two broken legs. Can you send a new one?",
    expectedOutput: "2"  // Clear damage >10% + no specific refund request
}

// Test Case 3.1
{
    description: "The phone case has a small scratch on the corner. I'd like a refund.",
    expectedOutput: "3"  // Damage below 10% threshold, automatic escalation
}

// Test Case 3.2
{
    description: "Everything looks fine but I changed my mind about the color.",
    expectedOutput: "3"  // No damage, automatic escalation
}