// OBJECTIVE: This file configures Prettier, an automated code formatting tool.
// It ensures that all files have identical formatting (like spacing, indentations, and quotation styles).

/** @type {import('prettier').Config} */
export default {
    // 1. Specifies the maximum line length (100 characters) before Prettier automatically wraps the code onto a new line.
    printWidth: 100,

    // 2. Enforces using single quotes ('example') instead of double quotes ("example") for text strings.
    singleQuote: true,

    // 3. Configures each tab indentation to be exactly 4 spaces.
    tabWidth: 4,

    // 4. Adds trailing commas at the end of elements in multi-line objects, arrays, and parameters (makes git diffs cleaner).
    trailingComma: 'all',
};
