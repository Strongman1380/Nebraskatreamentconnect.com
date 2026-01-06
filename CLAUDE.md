
# main-overview

> **Giga Operational Instructions**
> Read the relevant Markdown inside `.giga/rules` before citing project context. Reference the exact file you used in your response.

## Development Guidelines

- Only modify code directly relevant to the specific request. Avoid changing unrelated functionality.
- Never replace code with placeholders like `# ... rest of the processing ...`. Always include complete code.
- Break problems into smaller steps. Think through each step separately before implementing.
- Always provide a complete PLAN with REASONING based on evidence from code and logs before making changes.
- Explain your OBSERVATIONS clearly, then provide REASONING to identify the exact issue. Add console logs when needed to gather more information.


Treatment facility directory application managing Nebraska-based treatment centers with specialized status tracking and provider verification systems.

Core Business Components:

1. Facility Status Management
- Prioritized status system for treatment availability:
  - Emergency/Crisis Only (Highest Priority)
  - Openings Available
  - Accepting Assessments
  - Waitlist
  - No Openings
  - Contact for Availability (Lowest Priority)

2. Provider Verification Workflow
- Multi-step verification process:
  - Email verification requirement
  - Admin approval process
  - Facility association validation
- Role-based access control for facility status updates

3. Treatment Center Categorization
- Specialized classification system:
  - Treatment Centers
  - Halfway Houses
  - Outpatient Services
  - Detox Centers

4. Facility Data Rules
- Nebraska-specific address processing
- Age group classification (Adult/Juvenile/Both)
- Gender service policies (Male/Female/Co-ed)
- Treatment type compatibility tracking

Importance Score: 75/100
- Core business value in treatment facility matching
- Domain-specific status management
- Complex provider-facility relationships
- Specialized categorization rules

Critical Files:
- deploy/facility-utils.js
- deploy/provider-dashboard.js
- deploy/firebase-auth.js
- deploy/static-data-original.js

