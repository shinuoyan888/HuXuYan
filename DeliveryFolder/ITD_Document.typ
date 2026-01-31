// ITD Document - Best Bike Paths (BBP)
// Typst Document

#set document(
  title: "Implementation and Test Deliverable (ITD)",
  author: "BBP Team",
  date: datetime(year: 2026, month: 1, day: 31),
)

#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  header: context {
    if counter(page).get().first() > 1 [
      #set text(9pt, fill: gray)
      ITD - Best Bike Paths (BBP)
      #h(1fr)
      Software Engineering 2
    ]
  },
  footer: context {
    set text(9pt, fill: gray)
    h(1fr)
    counter(page).display("1 / 1", both: true)
    h(1fr)
  },
)

#set text(font: "New Computer Modern", size: 11pt)
#set par(justify: true, leading: 0.65em)
#set heading(numbering: "1.1")

#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  set text(16pt, weight: "bold", fill: rgb("#1a365d"))
  block(below: 1em)[#it]
}

#show heading.where(level: 2): it => {
  set text(13pt, weight: "bold", fill: rgb("#1e40af"))
  block(above: 1.5em, below: 0.8em)[#it]
}

#show heading.where(level: 3): it => {
  set text(11pt, weight: "bold", fill: rgb("#1e3a8a"))
  block(above: 1.2em, below: 0.6em)[#it]
}

#show raw.where(block: true): it => {
  set text(9pt)
  block(
    fill: rgb("#f1f5f9"),
    inset: 10pt,
    radius: 4pt,
    width: 100%,
    it
  )
}

#show raw.where(block: false): it => {
  box(
    fill: rgb("#f1f5f9"),
    inset: (x: 4pt, y: 2pt),
    radius: 2pt,
    text(size: 9pt, fill: rgb("#1e40af"), it)
  )
}

// ============== COVER PAGE ==============
#align(center)[
  #v(3cm)
  
  #text(24pt, weight: "bold", fill: rgb("#1a365d"))[
    Implementation and Test Deliverable (ITD)
  ]
  
  #v(1cm)
  
  #text(20pt, weight: "bold", fill: rgb("#2563eb"))[
    Best Bike Paths (BBP)
  ]
  
  #text(14pt)[Road Application]
  
  #v(2cm)
  
  #line(length: 60%, stroke: 2pt + rgb("#2563eb"))
  
  
  #table(
    columns: (auto, auto),
    stroke: none,
    align: (right, left),
    row-gutter: 8pt,
    [*Project Name:*], [Best Bike Paths (BBP)],
    [*Document Type:*], [Implementation and Test Deliverable (ITD)],
    [*Version:*], [1.0],
    [*Date:*], [January 31, 2026],
    [*Course:*], [Software Engineering 2],
  )

  #v(1cm)
  #text(12pt, weight: "bold")[Team Members]
  
  #v(0.5cm)
  
  #table(
    columns: (1fr, 1fr, 1fr),
    align: center,
    stroke: 0.5pt + gray,
    inset: 8pt,
    fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
    text(fill: white, weight: "bold")[Name], 
    text(fill: white, weight: "bold")[Student ID], 
    text(fill: white, weight: "bold")[Email],
    [kaifei xu], [11115439], [kaifei.xu\@mail.polimi.it],
    [Team Member 2], [Student ID], [email\@polimi.it],
    [Team Member 3], [Student ID], [email\@polimi.it],
  )
  

  
  #text(10pt, fill: gray)[
    Politecnico di Milano \
    Academic Year 2025-2026
  ]
]

#pagebreak()

// ============== TABLE OF CONTENTS ==============
#outline(
  title: [Table of Contents],
  indent: 2em,
  depth: 3,
)

#pagebreak()

// ============== CHAPTER 1: INTRODUCTION ==============
= Introduction

The Best Bike Paths (BBP) application is a comprehensive road condition monitoring and route planning system designed specifically for cyclists. The system enables users to:

- Report and track road conditions (potholes, surface quality, obstacles)
- Plan optimal cycling routes based on road quality data
- Contribute to a community-driven road quality database
- Receive intelligent route recommendations with safety scoring

This document describes the implementation details of the BBP prototype, including the architectural decisions, implemented features, testing procedures, and installation instructions.

== Purpose

This ITD document serves as the technical reference for the BBP implementation, providing:

- Documentation of all implemented functionalities
- Justification for technology choices
- Comprehensive testing results
- Step-by-step installation guide for deployment

== Definitions, Acronyms, and Abbreviations

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Term], text(fill: white, weight: "bold")[Definition],
  [BBP], [Best Bike Paths],
  [OSRM], [Open Source Routing Machine],
  [API], [Application Programming Interface],
  [REST], [Representational State Transfer],
  [CRUD], [Create, Read, Update, Delete],
  [i18n], [Internationalization],
  [SPA], [Single Page Application],
)

// ============== CHAPTER 2: SCOPE ==============
= Scope of the Document

This document covers the complete implementation of the BBP road application prototype, including:

+ *Backend Implementation*: FastAPI-based REST API server with in-memory data storage
+ *Frontend Implementation*: React-based Single Page Application with interactive maps
+ *Integration*: OSRM routing service integration for real road geometry
+ *Testing*: Unit tests and system-level test cases
+ *Deployment*: Installation and configuration instructions

== Document Boundaries

*This document focuses on:*
- #text(fill: rgb("#16a34a"))[✓] Implemented prototype features
- #text(fill: rgb("#16a34a"))[✓] Technical architecture and code structure
- #text(fill: rgb("#16a34a"))[✓] Testing methodology and results
- #text(fill: rgb("#16a34a"))[✓] Installation procedures

*This document does NOT cover:*
- #text(fill: rgb("#dc2626"))[✗] Production deployment configurations
- #text(fill: rgb("#dc2626"))[✗] Performance optimization strategies
- #text(fill: rgb("#dc2626"))[✗] Future enhancement roadmap

// ============== CHAPTER 3: IMPLEMENTED REQUIREMENTS ==============
= Implemented Requirements and Functions

== Implemented Features Overview

#table(
  columns: (1fr, 1.2fr, auto, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Category], 
  text(fill: white, weight: "bold")[Feature], 
  text(fill: white, weight: "bold")[Status], 
  text(fill: white, weight: "bold")[Priority],
  
  [*User Management*], [User Registration], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [User Settings], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [Multi-language Support], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  
  [*Segment Management*], [Create Road Segments], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [View Segments on Map], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Segment Status Tracking], [#text(fill: rgb("#16a34a"))[✓]], [High],
  
  [*Report System*], [Submit Condition Reports], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Report Confirmation], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Weighted Voting Aggregation], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Batch Confirmation], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  
  [*Route Planning*], [OSRM Route Integration], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Generate & Evaluate Algorithm], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Route Quality Scoring], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Multiple Route Alternatives], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  
  [*Trip Management*], [Create Trips], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Trip History], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [Privacy Protection], [#text(fill: rgb("#16a34a"))[✓]], [High],
  
  [*Auto Detection*], [Sensor-based Detection], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [Auto-confirm Reports], [#text(fill: rgb("#16a34a"))[✓]], [Low],
  
  [*Weather Service*], [Weather Information], [#text(fill: rgb("#16a34a"))[✓]], [Low],
  [], [Cycling Recommendations], [#text(fill: rgb("#16a34a"))[✓]], [Low],
  
  [*Internationalization*], [English (en)], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [Chinese (zh)], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [Italian (it)], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  
  [*Mobile Support*], [Responsive Design], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Mobile Navigation Menu], [#text(fill: rgb("#16a34a"))[✓]], [High],
  [], [Touch-friendly Interface], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
  [], [LAN Access for Testing], [#text(fill: rgb("#16a34a"))[✓]], [Medium],
)

== Detailed Feature Descriptions

=== User Management

*Implementation*: Users can register with a username. The system stores user preferences including language, dark mode, notification settings, and default map configurations.

```
API Endpoints:
- POST /api/users - Create or get user
- GET /api/users - List all users
- GET /api/users/{user_id}/settings - Get user settings
- PUT /api/users/{user_id}/settings - Update user settings
- PATCH /api/users/{user_id}/settings - Partial update settings
```

*Motivation*: User management is essential for personalized experience and tracking individual contributions to the road condition database.

=== Road Segment Management

*Implementation*: Road segments are defined by start and end GPS coordinates with associated status (optimal, medium, suboptimal, maintenance) and optional obstacle information.

*Status Classification:*

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
  text(fill: white, weight: "bold")[Status], 
  text(fill: white, weight: "bold")[Description], 
  text(fill: white, weight: "bold")[Color],
  [Optimal], [Excellent road condition], [#box(fill: rgb("#22c55e"), inset: 4pt, radius: 2pt)[Green]],
  [Medium], [Fair condition, minor issues], [#box(fill: rgb("#eab308"), inset: 4pt, radius: 2pt)[Yellow]],
  [Suboptimal], [Poor condition, caution advised], [#box(fill: rgb("#f97316"), inset: 4pt, radius: 2pt)[Orange]],
  [Maintenance], [Under repair, avoid if possible], [#box(fill: rgb("#ef4444"), inset: 4pt, radius: 2pt, text(fill: white)[Red])],
)

=== Report System with Weighted Voting

*Implementation*: Users submit reports for road segments. The system uses a weighted voting algorithm to aggregate reports and automatically update segment status.

*Weighting Algorithm:*

#block(
  fill: rgb("#eff6ff"),
  inset: 12pt,
  radius: 4pt,
  width: 100%,
)[
  *Weight Calculation:*
  - Base weight: 1.0
  - Fresh report (\< 30 days): ×2.0 multiplier
  - Confirmed report: ×1.5 multiplier

  *Status Determination:*
  - `negative_score >= 0.6` → "maintenance"
  - `negative_score >= 0.3` → "medium"
  - `positive_score > 0.7` → "optimal"
  - Otherwise → "medium"
]

*Motivation*: Weighted voting ensures that recent and verified reports have greater influence on road status, improving data accuracy over time.

=== Route Planning with Quality Scoring

*Implementation*: The "Generate & Evaluate" algorithm provides intelligent route recommendations:

*Phase 1: Candidate Generation*
+ Direct route from OSRM
+ Routes via perpendicular waypoints (15% offset)
+ Deduplication of similar routes (\>80% overlap)

*Phase 2: Scoring*

$ "Score" = "Distance" + "Penalty" $

#table(
  columns: (1fr, auto, auto, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Factor], 
  text(fill: white, weight: "bold")[safety\_first], 
  text(fill: white, weight: "bold")[balanced], 
  text(fill: white, weight: "bold")[shortest],
  [Pothole], [1200], [500], [100],
  [Maintenance], [10.0×length], [4.0×length], [0.8×length],
  [Bad Road], [5.0×length], [2.0×length], [0.3×length],
  [Medium Road], [1.5×length], [0.5×length], [0.1×length],
)

*Phase 3: Tagging*
- "Recommended" - Top-ranked route
- "Alternative" - Other viable routes
- "Best Surface" - Quality score \> 90
- "Fastest" - Shortest distance
- "Bumpy", "Road Work", "Poor Surface" - Warning tags

=== Mobile Responsive Design

*Implementation*: The application features a fully responsive design that adapts to different screen sizes:

*Mobile Navigation:*
- Hamburger menu (☰) replaces sidebar on screens < 768px
- Slide-out navigation overlay with touch-friendly controls
- Auto-close menu when navigating to new page

*Route Planning Mobile Mode:*
- Form/Map toggle buttons for switching between input form and map view
- Full-height map display when in Map mode
- Automatic map resize handling for proper rendering

*LAN Access Configuration:*
- Vite configured with `host: true` for network access
- Dynamic API base URL detection using `window.location.hostname`
- CORS configured to allow all origins for development/testing

*Motivation*: Mobile support is essential for cyclists who need to access the application on their phones while planning routes or reporting road conditions in the field.

=== Privacy By Design

*Implementation*: Location privacy protection following GDPR principles:

+ *Location Obfuscation*: Start/end points fuzzed by \~150m
+ *Coordinate Truncation*: Public coordinates rounded to 3 decimal places (\~100m precision)
+ *Trip Geometry Sanitization*: First and last 150m of trip routes obfuscated
+ *Private Data Separation*: Raw coordinates stored separately, only accessible by owner

== Excluded Features and Justification

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Feature], 
  text(fill: white, weight: "bold")[Reason for Exclusion],
  [User Authentication (JWT)], [Simplified for prototype; username-based identification sufficient for demo],
  [Persistent Database], [In-memory storage suitable for prototype; reduces deployment complexity],
  [Real-time Notifications], [Would require WebSocket infrastructure; deferred to future iteration],
  [Native Mobile App], [Responsive web app accessible via mobile browsers; native app not required for prototype],
  [Social Features], [Core functionality prioritized; social features are enhancement, not essential],
  [Payment Integration], [Out of scope for academic prototype],
)

// ============== CHAPTER 4: FRAMEWORKS ==============
= Adopted Development Frameworks

== Programming Languages

=== Backend: Python 3.10+

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Version*], [Python 3.10 or higher],
  [*Paradigm*], [Multi-paradigm (OOP, Functional)],
)

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Rapid development with clean, readable syntax
- #text(fill: rgb("#16a34a"))[✓] Excellent library ecosystem (FastAPI, Pydantic, httpx)
- #text(fill: rgb("#16a34a"))[✓] Strong type hints support for better code quality
- #text(fill: rgb("#16a34a"))[✓] Easy integration with scientific computing libraries
- #text(fill: rgb("#16a34a"))[✓] Large community and extensive documentation

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Slower execution compared to compiled languages
- #text(fill: rgb("#dc2626"))[✗] Global Interpreter Lock (GIL) limits true parallelism
- #text(fill: rgb("#dc2626"))[✗] Memory consumption higher than C/C++

*Justification*: Python's rapid development capabilities and the excellent FastAPI framework make it ideal for building REST APIs quickly while maintaining code quality through type hints.

=== Frontend: TypeScript 5.9

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Version*], [TypeScript \~5.9.3],
  [*Paradigm*], [Object-oriented, Functional],
)

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Static type checking catches errors at compile time
- #text(fill: rgb("#16a34a"))[✓] Enhanced IDE support with autocompletion
- #text(fill: rgb("#16a34a"))[✓] Better code maintainability and refactoring
- #text(fill: rgb("#16a34a"))[✓] Seamless integration with React ecosystem
- #text(fill: rgb("#16a34a"))[✓] Industry standard for modern web development

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Additional compilation step required
- #text(fill: rgb("#dc2626"))[✗] Learning curve for developers new to static typing
- #text(fill: rgb("#dc2626"))[✗] Type definitions may lag behind JavaScript libraries

*Justification*: TypeScript provides the type safety necessary for maintaining a complex React application while leveraging the vast JavaScript ecosystem.

== Frameworks

=== Backend Framework: FastAPI

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Automatic OpenAPI (Swagger) documentation generation
- #text(fill: rgb("#16a34a"))[✓] Built-in request validation via Pydantic
- #text(fill: rgb("#16a34a"))[✓] Native async/await support for high performance
- #text(fill: rgb("#16a34a"))[✓] Dependency injection system
- #text(fill: rgb("#16a34a"))[✓] Excellent developer experience

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Relatively new compared to Django/Flask
- #text(fill: rgb("#dc2626"))[✗] Smaller plugin ecosystem
- #text(fill: rgb("#dc2626"))[✗] Async programming complexity for beginners

=== Frontend Framework: React 19

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Component-based architecture promotes reusability
- #text(fill: rgb("#16a34a"))[✓] Virtual DOM for efficient rendering
- #text(fill: rgb("#16a34a"))[✓] Hooks API for state management
- #text(fill: rgb("#16a34a"))[✓] Large ecosystem and community support
- #text(fill: rgb("#16a34a"))[✓] Excellent developer tools

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Steep learning curve for beginners
- #text(fill: rgb("#dc2626"))[✗] Frequent updates may require migration effort
- #text(fill: rgb("#dc2626"))[✗] JSX syntax unconventional for some developers

=== Build Tool: Vite

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Extremely fast hot module replacement (HMR)
- #text(fill: rgb("#16a34a"))[✓] Native ES modules support
- #text(fill: rgb("#16a34a"))[✓] Optimized production builds
- #text(fill: rgb("#16a34a"))[✓] Simple configuration

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Less mature than Webpack
- #text(fill: rgb("#dc2626"))[✗] Some plugins may not be compatible

== Libraries and Middleware

=== Backend Libraries

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Library], 
  text(fill: white, weight: "bold")[Purpose], 
  text(fill: white, weight: "bold")[Version],
  [uvicorn], [ASGI server for FastAPI], [Latest],
  [pydantic], [Data validation and serialization], [Latest],
  [httpx], [HTTP client for OSRM API calls], [Latest],
  [python-multipart], [Form data parsing], [Latest],
)

=== Frontend Libraries

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Library], 
  text(fill: white, weight: "bold")[Purpose], 
  text(fill: white, weight: "bold")[Version],
  [react-leaflet], [React components for Leaflet maps], [5.0.0],
  [leaflet], [Interactive map library], [1.9.4],
)

== External APIs

=== OSRM (Open Source Routing Machine)

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Base URL*], [`http://router.project-osrm.org`],
  [*Profile*], [Bicycle routing],
  [*Timeout*], [10 seconds],
)

*Endpoints Used:*
```
GET /route/v1/bike/{coordinates}
Parameters:
- overview=full
- geometries=geojson
- alternatives=true/false
- steps=true
```

*Advantages:*
- #text(fill: rgb("#16a34a"))[✓] Free public API for bicycle routing
- #text(fill: rgb("#16a34a"))[✓] Real road geometry data
- #text(fill: rgb("#16a34a"))[✓] Support for alternative routes
- #text(fill: rgb("#16a34a"))[✓] Turn-by-turn navigation data

*Disadvantages:*
- #text(fill: rgb("#dc2626"))[✗] Rate limits on public server
- #text(fill: rgb("#dc2626"))[✗] No guaranteed uptime
- #text(fill: rgb("#dc2626"))[✗] Limited to road network coverage

*Fallback Strategy*: When OSRM is unavailable, the system falls back to geometric interpolation using Haversine distance calculations.

// ============== CHAPTER 5: CODE STRUCTURE ==============
= Structure of the Source Code

== Project Directory Structure

```
bbp-road-app/
├── README.md                    # Project documentation
├── backend/                     # Python FastAPI backend
│   ├── main.py                  # Main application (2144 lines)
│   ├── requirements.txt         # Python dependencies
│   └── test_routing.py          # Routing algorithm tests
├── frontend/                    # React TypeScript frontend
│   ├── index.html               # HTML entry point
│   ├── package.json             # Node.js dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite build configuration
│   └── src/                     # Source code
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Main application component
│       ├── AppContext.tsx       # Global state management
│       ├── api.ts               # API client functions
│       ├── Layout.tsx           # Page layout component
│       ├── DashboardPage.tsx    # Dashboard with statistics
│       ├── SegmentsPage.tsx     # Segment management
│       ├── ReportsPage.tsx      # Report submission
│       ├── RoutePlanningPage.tsx # Route planning interface
│       ├── TripsPage.tsx        # Trip creation
│       ├── TripHistoryPage.tsx  # Trip history view
│       ├── AutoDetectionPage.tsx # Auto-detection feature
│       ├── SettingsPage.tsx     # User settings
│       └── MapView.tsx          # Leaflet map component
└── node-v20.19.0-win-x64/       # Bundled Node.js runtime
```

== Backend Architecture

The backend follows a *layered service architecture*:

#figure(
  block(
    fill: rgb("#f8fafc"),
    inset: 12pt,
    radius: 4pt,
    width: 100%,
  )[
    #align(center)[
      #box(fill: rgb("#dbeafe"), inset: 8pt, radius: 4pt, width: 90%)[
        *API Layer (FastAPI)* \
        Endpoints: /api/users, /api/segments, /api/trips, etc.
      ]
      #v(8pt)
      #box(fill: rgb("#dcfce7"), inset: 8pt, radius: 4pt, width: 90%)[
        *Service Layer* \
        WeatherService | RoutingService | AggregationService
      ]
      #v(8pt)
      #box(fill: rgb("#fef3c7"), inset: 8pt, radius: 4pt, width: 90%)[
        *Data Models (Pydantic)* \
        UserCreate, SegmentCreate, ReportCreate, TripCreate
      ]
      #v(8pt)
      #box(fill: rgb("#fee2e2"), inset: 8pt, radius: 4pt, width: 90%)[
        *Data Storage Layer* \
        USERS: Dict, SEGMENTS: Dict, REPORTS: Dict, TRIPS: Dict
      ]
    ]
  ],
  caption: [Backend Architecture Diagram],
)

=== Module Organization (main.py sections)

#table(
  columns: (auto, auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Lines], 
  text(fill: white, weight: "bold")[Section], 
  text(fill: white, weight: "bold")[Description],
  [1-130], [i18n], [Translation dictionaries and helper functions],
  [131-230], [Weather Service], [Mock weather data generation],
  [231-300], [OSRM Integration], [Route fetching from OSRM API],
  [300-400], [Route Utilities], [Perpendicular waypoint calculation],
  [400-500], [Geo Utilities], [Haversine distance, path generation],
  [500-650], [Privacy Helpers], [Location obfuscation],
  [650-720], [Aggregation Service], [Weighted voting algorithm],
  [720-800], [Data Storage], [In-memory stores and Pydantic models],
  [800-900], [Demo Data], [Sample data initialization],
  [900-1200], [CRUD Endpoints], [Users, Segments, Reports, Trips],
  [1200-1350], [Auto-Detection], [Sensor-based pothole detection],
  [1350-1500], [Settings API], [User settings, weather endpoints],
  [1500-1700], [Route Preview], [Multi-route preview, i18n API],
  [1700-2144], [Path Search], [Generate & Evaluate algorithm],
)

== Frontend Architecture

The frontend follows a *component-based architecture* with centralized state management.

=== Component Descriptions

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Component], 
  text(fill: white, weight: "bold")[Responsibility], 
  text(fill: white, weight: "bold")[Lines],
  [App.tsx], [Root component, routing logic, user state], [\~70],
  [AppContext.tsx], [Global state provider (dark mode, i18n)], [\~330],
  [Layout.tsx], [Responsive navigation with mobile hamburger menu], [\~250],
  [DashboardPage.tsx], [Statistics cards, segment map], [\~314],
  [SegmentsPage.tsx], [Segment CRUD, map visualization], [\~241],
  [ReportsPage.tsx], [Report submission, confirmation], [\~281],
  [RoutePlanningPage.tsx], [Route search with mobile Form/Map toggle], [\~700],
  [TripsPage.tsx], [Trip creation with OSRM], [\~200],
  [TripHistoryPage.tsx], [Historical trip listing], [\~150],
  [AutoDetectionPage.tsx], [Sensor-based detection interface], [\~200],
  [SettingsPage.tsx], [User preferences configuration], [\~250],
  [MapView.tsx], [Reusable Leaflet map wrapper], [\~150],
  [api.ts], [HTTP client, type definitions], [\~337],
)

== Data Flow Diagram

#figure(
  block(
    fill: rgb("#f8fafc"),
    inset: 12pt,
    radius: 4pt,
  )[
    #align(center)[
      #grid(
        columns: (1fr, auto, 1fr, auto, 1fr),
        gutter: 8pt,
        box(fill: rgb("#dbeafe"), inset: 8pt, radius: 4pt)[React Frontend],
        [↔],
        box(fill: rgb("#dcfce7"), inset: 8pt, radius: 4pt)[FastAPI Backend],
        [↔],
        box(fill: rgb("#fef3c7"), inset: 8pt, radius: 4pt)[In-Memory Store],
      )
      #v(12pt)
      #grid(
        columns: (1fr, 1fr),
        gutter: 16pt,
        [↓ Leaflet Tiles],
        [↓ HTTP/JSON],
      )
      #v(8pt)
      #grid(
        columns: (1fr, 1fr),
        gutter: 16pt,
        box(fill: rgb("#e0e7ff"), inset: 8pt, radius: 4pt)[OpenStreetMap],
        box(fill: rgb("#fce7f3"), inset: 8pt, radius: 4pt)[OSRM Server],
      )
    ]
  ],
  caption: [System Data Flow],
)

// ============== CHAPTER 6: TESTING ==============
= Testing

== Testing Strategy

The testing strategy follows the Test Plan outlined in the Design Document (DD), with focus on:

+ *Unit Testing*: Individual function testing
+ *Integration Testing*: API endpoint testing
+ *System Testing*: End-to-end user scenario testing

== Test Environment

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
  text(fill: white, weight: "bold")[Component], 
  text(fill: white, weight: "bold")[Configuration],
  [Backend], [Python 3.10+, FastAPI TestClient],
  [Frontend], [Manual testing in Chrome/Firefox],
  [OSRM], [Public server (router.project-osrm.org)],
  [Map Tiles], [OpenStreetMap],
)

== System Test Cases

=== Test Case 1: User Registration and Login

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Test ID*], [STC-001],
  [*Objective*], [Verify user can register and login successfully],
  [*Preconditions*], [Backend server running, Frontend accessible],
  [*Input*], [Username: "testuser"],
  [*Steps*], [1. Navigate to login page #linebreak() 2. Enter username "testuser" #linebreak() 3. Click "Login" button],
  [*Expected Output*], [User redirected to dashboard, username displayed in header],
  [*Actual Result*], [#text(fill: rgb("#16a34a"))[✓ PASSED] - User successfully logged in],
)

=== Test Case 2: Create Road Segment

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Test ID*], [STC-002],
  [*Objective*], [Verify user can create a new road segment],
  [*Preconditions*], [User logged in],
  [*Input*], [Start: (1.3521, 103.8198), End: (1.3621, 103.8298), Status: "optimal"],
  [*Steps*], [1. Navigate to Segments page #linebreak() 2. Enter coordinates #linebreak() 3. Select status #linebreak() 4. Click "Create"],
  [*Expected Output*], [New segment appears in list and on map],
  [*Actual Result*], [#text(fill: rgb("#16a34a"))[✓ PASSED] - Segment created with correct coordinates],
)

=== Test Case 3: Submit Condition Report

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Test ID*], [STC-003],
  [*Objective*], [Verify user can submit a condition report],
  [*Preconditions*], [User logged in, at least one segment exists],
  [*Input*], [Segment ID: 1, Note: "Pothole near intersection"],
  [*Steps*], [1. Select segment from list #linebreak() 2. Navigate to Reports #linebreak() 3. Enter note #linebreak() 4. Click "Submit"],
  [*Expected Output*], [Report appears in list, aggregation updated],
  [*Actual Result*], [#text(fill: rgb("#16a34a"))[✓ PASSED] - Report submitted successfully],
)

=== Test Case 4: Report Confirmation

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Test ID*], [STC-004],
  [*Objective*], [Verify report confirmation updates aggregation],
  [*Preconditions*], [At least one unconfirmed report exists],
  [*Input*], [Report ID to confirm],
  [*Steps*], [1. Find unconfirmed report #linebreak() 2. Click "Confirm" button],
  [*Expected Output*], [Report marked as confirmed, weighted score updated],
  [*Actual Result*], [#text(fill: rgb("#16a34a"))[✓ PASSED] - Confirmation status updated],
)

=== Test Case 5: Route Planning with OSRM

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  [*Test ID*], [STC-005],
  [*Objective*], [Verify route planning returns multiple alternatives],
  [*Preconditions*], [OSRM server accessible],
  [*Input*], [Origin: (1.3521, 103.8198), Destination: (1.332, 103.903), Preference: "balanced"],
  [*Steps*], [1. Navigate to Route Planning #linebreak() 2. Enter coordinates #linebreak() 3. Select preference #linebreak() 4. Click "Search Routes"],
  [*Expected Output*], [1-3 routes displayed with quality scores and tags],
  [*Actual Result*], [#text(fill: rgb("#16a34a"))[✓ PASSED] - Multiple routes returned with scoring],
)

=== Test Case 6-10: Additional Tests

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Test ID], 
  text(fill: white, weight: "bold")[Objective], 
  text(fill: white, weight: "bold")[Result],
  [STC-006], [Route Quality Scoring (Safety First)], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-007], [Weather Information Display], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-008], [Language Switching], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-009], [Data Aggregation Trigger], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-010], [Auto-Detection Simulation], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
)

=== Test Case 11-14: Mobile Responsive Tests

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Test ID], 
  text(fill: white, weight: "bold")[Objective], 
  text(fill: white, weight: "bold")[Result],
  [STC-011], [Mobile hamburger menu navigation], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-012], [Route Planning Form/Map toggle on mobile], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-013], [LAN access from mobile device], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [STC-014], [Touch-friendly button and input sizing], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
)

== API Testing Results

#table(
  columns: (1fr, auto, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Result],
  [`/api/users`], [POST], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/users`], [GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/segments`], [GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/segments`], [POST], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/segments/{id}/reports`], [POST/GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/reports/{id}/confirm`], [POST], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/segments/{id}/aggregate`], [GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/aggregation/trigger`], [POST], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/trips`], [POST/GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/path/search`], [POST], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/weather`], [GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/users/{id}/settings`], [GET/PUT/PATCH], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
  [`/api/i18n/translations`], [GET], [#text(fill: rgb("#16a34a"))[✓ PASSED]],
)

// ============== CHAPTER 7: INSTALLATION ==============
= Installation Instructions

== Prerequisites

#table(
  columns: (auto, auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
  text(fill: white, weight: "bold")[Requirement], 
  text(fill: white, weight: "bold")[Version], 
  text(fill: white, weight: "bold")[Notes],
  [Python], [3.10+], [Required for backend],
  [Node.js], [20.x], [Bundled in package],
  [npm], [9.x+], [Comes with Node.js],
  [Web Browser], [Chrome/Firefox/Edge], [For frontend access],
  [Internet], [Required], [For OSRM API and map tiles],
)

== Quick Start (Windows)

=== Step 1: Extract the Package

```powershell
# Navigate to the delivery folder
cd C:\path\to\DeliveryFolder\bbp-road-app
```

=== Step 2: Start Backend Server

```powershell
# Open PowerShell in backend directory
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn main:app --host 127.0.0.1 --port 8000
```

The backend will be running at: `http://127.0.0.1:8000`

API documentation available at: `http://127.0.0.1:8000/docs`

=== Step 3: Start Frontend Development Server

```powershell
# Open a NEW PowerShell window
cd C:\path\to\DeliveryFolder\bbp-road-app\frontend

# Use bundled Node.js
$env:PATH = "..\node-v20.19.0-win-x64\node-v20.19.0-win-x64;" + $env:PATH

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend will be running at: `http://localhost:5173`

=== Step 4: Access the Application

+ Open a web browser
+ Navigate to `http://localhost:5173`
+ Enter any username to login (e.g., "alice" for demo data)

== Detailed Installation (Linux/macOS)

=== Backend Setup

```bash
# Navigate to backend
cd bbp-road-app/backend

# Create virtual environment
python3 -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --host 127.0.0.1 --port 8000
```

=== Frontend Setup

```bash
# Navigate to frontend
cd bbp-road-app/frontend

# Install Node.js dependencies
npm install

# Run development server
npm run dev
```

== Troubleshooting

#table(
  columns: (auto, 1fr),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Issue], 
  text(fill: white, weight: "bold")[Solution],
  [Port 8000 in use], [Change port: `uvicorn main:app --port 8001`],
  [CORS errors], [Ensure backend is running on 127.0.0.1:8000],
  [npm install fails], [Delete `node_modules` and `package-lock.json`, retry],
  [Map not loading], [Check internet connection (requires OpenStreetMap tiles)],
  [OSRM timeout], [Increase timeout in code or use fallback routes],
  [Python not found], [Install Python 3.10+ and add to PATH],
)

== Available Acceptance Test Infrastructure

This application is a *responsive web application* that can be tested on mobile devices through the following methods:

=== Supported Test Platforms

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Platform], 
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Status],
  [Android Device], [Mobile browser (Chrome/Firefox)], [#text(fill: rgb("#16a34a"))[✓ Supported]],
  [iOS Device], [Mobile browser (Safari/Chrome)], [#text(fill: rgb("#16a34a"))[✓ Supported]],
  [Android Emulator], [Browser in emulator], [#text(fill: rgb("#16a34a"))[✓ Supported]],
  [iOS Simulator (macOS)], [Safari in simulator], [#text(fill: rgb("#16a34a"))[✓ Supported]],
)

=== Mobile Testing Instructions

*Step 1: Start servers with LAN access*

```powershell
# Terminal 1: Start backend with LAN access
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend (already configured for LAN)
cd frontend
npm run dev
# Note: Vite will display both localhost and LAN URLs
```

*Step 2: Find your computer's IP address*

```powershell
# Windows
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

*Step 3: Access from mobile device*

+ Ensure mobile device is on the *same WiFi network* as the computer
+ Open mobile browser and navigate to: `http://<your-ip>:5173`
+ Example: `http://192.168.1.100:5173`

*Step 4: (Optional) Generate QR Code*

+ Use any online QR code generator (e.g., qr-code-generator.com)
+ Enter URL: `http://<your-ip>:5173`
+ Scan QR code with mobile device camera

#block(
  fill: rgb("#fef3c7"),
  inset: 12pt,
  radius: 4pt,
  width: 100%,
)[
  *Note:* Since this is a web application, no APK or IPA installation is required. The application is fully functional in mobile browsers with responsive design support.
]

// ============== CHAPTER 8: EFFORT SPENT ==============
= Effort Spent

== Individual Effort

#table(
  columns: (1fr, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
  text(fill: white, weight: "bold")[Team Member], 
  text(fill: white, weight: "bold")[Task], 
  text(fill: white, weight: "bold")[Hours],
  [Hu Xu Yan], [Backend API Development], [XX],
  [Hu Xu Yan], [Frontend Development], [XX],
  [Hu Xu Yan], [OSRM Integration], [XX],
  [Hu Xu Yan], [Testing], [XX],
  [Hu Xu Yan], [Documentation], [XX],
  [*Hu Xu Yan Total*], [], [*XX*],
  [], [], [],
  [Team Member 2], [Tasks], [XX],
  [*Team Member 2 Total*], [], [*XX*],
  [], [], [],
  [Team Member 3], [Tasks], [XX],
  [*Team Member 3 Total*], [], [*XX*],
)

== Effort Summary

#table(
  columns: (1fr, auto, auto),
  stroke: 0.5pt + gray,
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else { white },
  text(fill: white, weight: "bold")[Phase], 
  text(fill: white, weight: "bold")[Hours], 
  text(fill: white, weight: "bold")[Percentage],
  [Requirements Analysis], [X], [X%],
  [Design], [X], [X%],
  [Implementation], [X], [X%],
  [Testing], [X], [X%],
  [Documentation], [kaifei xu], [100%],
  [*Total*], [*XX*], [*100%*],
)

== Generative AI Usage Declaration

In accordance with course requirements, we declare the use of Generative AI (GitHub Copilot / Claude) in the following capacities:

#table(
  columns: (auto, auto, 1fr, 1fr, auto),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold", size: 9pt)[Task], 
  text(fill: white, weight: "bold", size: 9pt)[AI Tool], 
  text(fill: white, weight: "bold", size: 9pt)[Input], 
  text(fill: white, weight: "bold", size: 9pt)[Output], 
  text(fill: white, weight: "bold", size: 9pt)[Verification],
  [Code Docs], [Copilot], [Add docstrings], [Function docs], [Manual review],
  [ITD Draft], [Claude], [Project code + requirements], [Document content], [Fact verification],
  [Test Cases], [Claude], [Generate test cases], [Test templates], [Execution],
  [Code Review], [Copilot], [Code snippets], [Improvements], [Assessment],
)

*Verification Process:*
+ All AI-generated code was reviewed for correctness
+ AI-generated documentation was verified against actual implementation
+ Test cases were executed to confirm validity
+ No AI output was used without human verification

// ============== CHAPTER 9: REFERENCES ==============
= References

== Technical Documentation

+ *FastAPI Documentation* - https://fastapi.tiangolo.com/
+ *React Documentation* - https://react.dev/
+ *TypeScript Documentation* - https://www.typescriptlang.org/docs/
+ *Vite Documentation* - https://vitejs.dev/
+ *Leaflet Documentation* - https://leafletjs.com/reference.html
+ *React-Leaflet Documentation* - https://react-leaflet.js.org/
+ *OSRM API Documentation* - http://project-osrm.org/docs/v5.24.0/api/
+ *Pydantic Documentation* - https://docs.pydantic.dev/

== Course Materials

+ *RASD Document* - Requirements Analysis and Specification Document (BBP Project)
+ *DD Document* - Design Document (BBP Project)
+ *Course Slides* - Software Engineering 2, Politecnico di Milano

== Standards

+ *REST API Design Guidelines* - https://restfulapi.net/
+ *GeoJSON Specification* - RFC 7946
+ *Polyline Encoding* - Google Polyline Algorithm

== Tools

+ *Visual Studio Code* - IDE
+ *Git* - Version Control
+ *Postman* - API Testing
+ *Chrome DevTools* - Frontend Debugging

// ============== APPENDIX ==============
#pagebreak()

= Appendix A: API Endpoint Reference

== User Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [POST], [`/api/users`], [Create or get user],
  [GET], [`/api/users`], [List all users],
  [GET], [`/api/users/{id}/settings`], [Get user settings],
  [PUT], [`/api/users/{id}/settings`], [Update all settings],
  [PATCH], [`/api/users/{id}/settings`], [Partial update settings],
)

== Segment Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [GET], [`/api/segments`], [List all segments],
  [POST], [`/api/segments`], [Create segment],
  [GET], [`/api/segments/{id}/aggregate`], [Get aggregation result],
  [POST], [`/api/segments/{id}/auto-detect`], [Run auto-detection],
  [POST], [`/api/segments/{id}/apply-detection`], [Apply detection result],
)

== Report Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [GET], [`/api/segments/{id}/reports`], [List reports for segment],
  [POST], [`/api/segments/{id}/reports`], [Create report],
  [POST], [`/api/reports/{id}/confirm`], [Confirm report],
  [POST], [`/api/reports/batch-confirm`], [Batch confirm],
)

== Trip Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [GET], [`/api/trips`], [List trips],
  [POST], [`/api/trips`], [Create trip],
  [GET], [`/api/trips/{id}`], [Get trip details],
  [DELETE], [`/api/trips/{id}`], [Delete trip],
)

== Route Planning Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [POST], [`/api/routes`], [Preview routes],
  [POST], [`/api/path/search`], [Search routes with scoring],
)

== Utility Endpoints

#table(
  columns: (auto, 1fr, 1fr),
  stroke: 0.5pt + gray,
  inset: 6pt,
  fill: (col, row) => if row == 0 { rgb("#1e40af") } else if calc.odd(row) { rgb("#f3f4f6") } else { white },
  text(fill: white, weight: "bold")[Method], 
  text(fill: white, weight: "bold")[Endpoint], 
  text(fill: white, weight: "bold")[Description],
  [GET], [`/api/stats`], [Get statistics],
  [GET], [`/api/weather`], [Get weather data],
  [GET], [`/api/i18n/translations`], [Get translations],
  [GET], [`/api/i18n/languages`], [Get available languages],
  [POST], [`/api/aggregation/trigger`], [Trigger bulk aggregation],
)

#v(2cm)

#align(center)[
  #line(length: 40%, stroke: 1pt + gray)
  #v(0.5cm)
  #text(10pt, fill: gray)[
    Document generated: January 31, 2026 \
    End of Document
  ]
]
