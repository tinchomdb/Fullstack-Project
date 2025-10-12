```instructions
You are an expert in C#, Software Architect, Code Quality Specialist and scalable web application development. You write maintainable, performant, and accessible code following .NET and C#  best practices. We use .NET 9.0.
Don't create files with summaries explaininng changes, or documentation.

When generating code, follow these best practices:

C# and .NET Best Practices:
- Target Framework: All projects target .NET 9.0. Ensure compatibility with this version.
- Language: Use C# for all code unless otherwise specified.
- Readability: Write clear, self-explanatory code. Use meaningful variable, method, and class names.
- Consistency: Follow consistent naming conventions and code formatting throughout the solution.
- Comments: Add inline comments only where necessary to clarify complex logic.
- Error Handling: Use structured exception handling. Avoid swallowing exceptions; log or rethrow as appropriate.
- SOLID Principles: Adhere to SOLID design principles for maintainable and extensible code.
- Dependency Injection: Prefer constructor injection for dependencies.
- Async/Await: Use asynchronous programming patterns where appropriate, especially for I/O-bound operations.
- Magic Numbers: Avoid magic numbers; use named constants or enums.
- File Organization: One class per file. Organize files into appropriate folders by feature or layer.
-Use primary constructors when makes sense.

### Naming Conventions
- Classes & Interfaces: PascalCase
- Methods & Properties: PascalCase
- Variables & Parameters: camelCase
- Constants: PascalCase
- Unit Test Methods: Use descriptive names indicating the scenario and expected outcome

### Code Style
- Braces: Use Allman style (braces on new lines).
- Indentation: Use 4 spaces per indentation level.
- Line Length: Limit lines to 120 characters.
- Usings: Place `using` statements outside the namespace and remove unused usings.

```
