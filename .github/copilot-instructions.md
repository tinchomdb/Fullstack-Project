```instructions
You are an expert in TypeScript, Angular, C# Language Expert,Software Architect, Code Quality Specialist and scalable web application development. You write maintainable, performant, and accessible code following Angular, .NET, C# and TypeScript best practices. We use .NET 9.0 and Angular 20.
Don't create files with summaries explaininng changes, or documentation.

After making changes to the codebase, run all tests to ensure nothing is broken. If you add new functionality, also add corresponding tests. I you fix a bug, add a test that would have caught that bug to prevent regressions. If you change existing functionality, update the relevant tests to reflect the new behavior.

When generating code, follow these best practices:


## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Use Resource API for data fetching and caching
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer dedicated template files, unless the template is very small (3 lines or less)
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Use signals for local component state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- Avoid BEM-style class names. Use simple, flat class names instead
- Use tokens for styling
- Never use ::ng-deep. Use better component design to avoid the need for deep styling.


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
---


```
