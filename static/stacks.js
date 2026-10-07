const KINDS = {
  website: "Website / portfolio",
  webapp: "Web app / SaaS",
  mobile: "Mobile app",
  api: "API / backend service",
  ai: "AI assistant / chatbot",
  data: "Data dashboard",
  desktop: "Desktop app",
  script: "Script / automation",
  game: "Game",
  store: "Online store",
  extension: "Browser extension",
};

const LANGS = {
  any: "Not sure",
  ts: "JavaScript / TS",
  py: "Python",
  net: "C# / .NET",
  java: "Java",
  go: "Go",
};

const FLAGS = {
  login: "User login",
  payments: "Payments",
  realtime: "Live updates",
  ai: "AI features",
};

const SCALES = ["Just me", "A few", "Thousands", "Millions"];

const DEFAULT_LANG = {
  website: "ts", webapp: "ts", mobile: "ts", api: "py", ai: "py", data: "py",
  desktop: "ts", script: "py", game: "any", store: "any", extension: "ts",
};

const L = (role, name, why) => ({ role, name, why });

const AUTH = {
  ts: L("Login", "Supabase Auth", "Email, Google and magic-link sign-in with no auth server to run."),
  py: L("Login", "Django auth + django-allauth", "Built into Django. allauth adds Google and Microsoft sign-in."),
  net: L("Login", "ASP.NET Core Identity", "Built into .NET. Add Microsoft Entra ID or Google in a few lines."),
  java: L("Login", "Spring Security", "The standard for Spring apps, with OAuth2 login built in."),
  go: L("Login", "Auth0 or Supabase Auth (OIDC)", "Hand login to a provider instead of writing it yourself."),
};

const DB = {
  ts: L("Database", "Postgres on Supabase", "Hosted Postgres with a table editor and backups. Free tier to start."),
  py: L("Database", "PostgreSQL via the Django ORM", "SQLite while you build, Postgres in production. Same code."),
  net: L("Database", "PostgreSQL + EF Core", "EF Core migrations keep the schema in your C# code."),
  java: L("Database", "PostgreSQL + Spring Data JPA", "Repositories give you queries with almost no SQL."),
  go: L("Database", "PostgreSQL + pgx + sqlc", "Write plain SQL, get type-safe Go functions."),
};

const HOST = {
  ts: L("Hosting", "Vercel", "Push to GitHub and it deploys. Free for hobby projects."),
  py: L("Hosting", "Render or Railway", "Git-push deploys with a managed Postgres next to your app."),
  net: L("Hosting", "Azure App Service", "First-class .NET hosting with a free tier to start."),
  java: L("Hosting", "Railway or Render", "Deploys a Spring Boot jar or Docker image straight from Git."),
  go: L("Hosting", "Fly.io", "Ships one small binary to servers near your users."),
};

const REALTIME = {
  ts: L("Live updates", "Supabase Realtime", "Screens subscribe to database changes. No socket server to run."),
  py: L("Live updates", "Django Channels", "WebSockets inside your Django app."),
  net: L("Live updates", "SignalR", "Real-time hubs built into ASP.NET Core."),
  java: L("Live updates", "Spring WebSocket (STOMP)", "Push messages to every subscribed browser."),
  go: L("Live updates", "coder/websocket", "Small, well-maintained WebSocket library."),
};

const AI = {
  ts: L("AI", "Vercel AI SDK", "One API for Claude, OpenAI and Gemini, with streaming chat helpers."),
  py: L("AI", "Claude or OpenAI Python SDK", "Official SDKs with streaming and tool use built in."),
  net: L("AI", "Microsoft.Extensions.AI", "One .NET interface over OpenAI, Azure OpenAI and local models."),
  java: L("AI", "Spring AI", "Model clients and vector stores, the Spring way."),
  go: L("AI", "Official Go SDKs (anthropic-sdk-go / openai-go)", "Typed clients, no wrapper library needed."),
};

const PAY = L("Payments", "Stripe", "Checkout for one-off payments, Billing for subscriptions. Card data never touches your server.");

const BIG_SCALE = L("Scale", "Redis cache + CDN, containers on Cloud Run or Kubernetes", "Serve repeat reads from memory and run more copies of a stateless server as traffic grows.");

const SPRING = (deps) => `curl https://start.spring.io/starter.zip -d dependencies=${deps} -o app.zip`;

function pick(table, lang) {
  return table[lang] || table.ts;
}

function extras(layers, s, lang, { login = true } = {}) {
  if (login && s.flags.login) layers.push(pick(AUTH, lang));
  if (s.flags.realtime) layers.push(pick(REALTIME, lang));
  if (s.flags.payments) layers.push(PAY);
  if (s.flags.ai) layers.push(pick(AI, lang));
}

const BUILDERS = {
  website(s, lang) {
    const layers = [
      L("Framework", "Astro + Tailwind CSS", "Ships plain HTML, so pages load fast and rank well on Google."),
      L("Content", "Markdown files in the repo", "No database. Add a CMS like Decap or Sanity only if non-developers edit."),
    ];
    if (s.flags.payments) layers.push(L("Payments", "Stripe Payment Links", "Sell without a backend: create a link, paste it on the page."));
    layers.push(L("Hosting", "Cloudflare Pages or Netlify", "Free static hosting with your own domain and HTTPS."));
    return {
      title: "Astro on Cloudflare Pages",
      summary: lang === "ts" || lang === "any"
        ? "A fast static site from Markdown pages, deployed free on every Git push."
        : "Astro is mostly HTML and Markdown, so you need very little JavaScript. Deploys free on every Git push.",
      layers,
      start: { cmd: "npm create astro@latest", note: "Pick the blog or portfolio starter when it asks." },
      alt: lang === "py"
        ? "A docs site? MkDocs Material is the Python way."
        : "Prefer designing visually? Framer or Webflow get you there with no code.",
    };
  },

  webapp(s, lang) {
    if (lang === "py") {
      const layers = [
        L("Front end", "Django templates + HTMX + Tailwind", "Interactive pages without a JavaScript framework."),
        L("Back end", "Django", "Batteries included: ORM, admin panel, forms and security."),
        DB.py,
      ];
      extras(layers, s, "py");
      layers.push(HOST.py);
      return {
        title: "Django + HTMX + Postgres",
        summary: "One Python project gives you pages, data, an admin panel and login.",
        layers,
        start: { cmd: "pip install django && django-admin startproject mysite", note: "Then: python manage.py runserver" },
        alt: "Need a richer UI later? Keep Django as an API (Django Ninja) and add a React front end.",
      };
    }
    if (lang === "net") {
      const layers = [
        L("Front end", "Blazor", "Build the UI in C# and Razor. No JavaScript needed."),
        L("Back end", "ASP.NET Core", "Same project as the UI; one deploy."),
        DB.net,
      ];
      extras(layers, s, "net");
      layers.push(HOST.net);
      return {
        title: "Blazor + ASP.NET Core + Postgres",
        summary: "All C#, end to end, in a single project.",
        layers,
        start: { cmd: s.flags.login ? "dotnet new blazor -o MyApp --auth Individual" : "dotnet new blazor -o MyApp", note: "Then: cd MyApp && dotnet watch" },
        alt: "Want a JavaScript front end? ASP.NET Core API + React (Vite).",
      };
    }
    if (lang === "java") {
      const layers = [
        L("Front end", "React (Vite) + Tailwind", "The most common UI stack, huge component choice."),
        L("Back end", "Spring Boot", "Production defaults for REST, security and data."),
        DB.java,
      ];
      extras(layers, s, "java");
      layers.push(HOST.java);
      return {
        title: "Spring Boot + React + Postgres",
        summary: "A Java back end you already know, with a modern React front end.",
        layers,
        start: { cmd: SPRING("web,data-jpa,postgresql" + (s.flags.login ? ",security" : "")), note: "Then: npm create vite@latest web -- --template react-ts" },
        alt: "Prefer server-rendered pages? Spring Boot + Thymeleaf + HTMX.",
      };
    }
    if (lang === "go") {
      const layers = [
        L("Front end", "templ + HTMX + Tailwind", "Type-safe HTML templates in Go, interactivity without a JS framework."),
        L("Back end", "Go standard library (net/http)", "Method routing is built in since Go 1.22. One static binary."),
        DB.go,
      ];
      extras(layers, s, "go");
      layers.push(HOST.go);
      return {
        title: "Go + templ + HTMX",
        summary: "One fast Go binary serves pages and data.",
        layers,
        start: { cmd: "go mod init myapp && go install github.com/a-h/templ/cmd/templ@latest", note: "" },
        alt: "Want batteries included? PocketBase gives you login, database and admin in one Go binary.",
      };
    }
    const layers = [
      L("Front end", "Next.js + Tailwind + shadcn/ui", "React pages and server code in one project, with polished ready-made components."),
      L("Back end", "Next.js server actions", "No separate back end to build or deploy."),
      DB.ts,
    ];
    extras(layers, s, "ts");
    layers.push(HOST.ts);
    return {
      title: "Next.js + Supabase on Vercel",
      summary: "One TypeScript project for screens and server, a hosted Postgres with login built in, push-to-deploy hosting.",
      layers,
      start: { cmd: "npx create-next-app@latest my-app", note: "Then: npx shadcn@latest init, and create a free Supabase project." },
      alt: "More at home in Python? Django + HTMX gives you login and an admin panel out of the box.",
    };
  },

  mobile(s, lang) {
    const local = s.scale === 0 && !s.flags.login && !s.flags.realtime;
    const payments = L("Payments", "RevenueCat", "Apple and Google require in-app purchase for digital goods. RevenueCat handles both stores.");
    const cost = "Free to build. $99/yr Apple, $25 once Google to publish";
    if (lang === "net") {
      const layers = [
        L("App", ".NET MAUI", "C# and XAML for iPhone, Android, Windows and Mac."),
        local
          ? L("Data", "SQLite on the device (sqlite-net)", "Works offline. Nothing to host.")
          : L("Back end", "ASP.NET Core API + Postgres", "Shared data and login across phones."),
      ];
      if (!local && s.flags.login) layers.push(AUTH.net);
      if (s.flags.realtime) layers.push(REALTIME.net);
      if (s.flags.payments) layers.push(payments);
      if (s.flags.ai) layers.push(AI.net);
      layers.push(L("Publish", "App Store + Google Play", "Build iOS on a Mac, Android anywhere."));
      return {
        title: ".NET MAUI",
        summary: "One C# codebase for both phones.",
        layers,
        start: { cmd: "dotnet new maui -o MyApp", note: "Run on an Android emulator first, it is the quickest loop." },
        alt: "Expo (React Native) has a bigger ecosystem if you are open to TypeScript.",
        cost,
      };
    }
    const layers = [
      L("App", "Expo (React Native) + TypeScript", "One codebase for iPhone and Android. Try it live on your phone with Expo Go."),
      L("Styling", "NativeWind", "Tailwind CSS classes for React Native."),
      local
        ? L("Data", "SQLite on the device (expo-sqlite)", "Works offline. Nothing to host.")
        : L("Back end", "Supabase (Postgres + Auth)", "Data syncs between phones, login built in."),
    ];
    if (s.flags.realtime) layers.push(REALTIME.ts);
    if (s.flags.payments) layers.push(payments);
    if (s.flags.ai) layers.push(L("AI", "Your own API endpoint + model SDK", "Never ship model API keys inside the app. Call them from a small server function."));
    layers.push(L("Publish", "EAS Build", "Cloud builds for both stores. No Mac needed for the iPhone build."));
    const note = lang === "py" || lang === "go"
      ? "There is no smooth Python or Go path for phone apps. TypeScript with Expo is the gentlest switch."
      : lang === "java"
        ? "Android only? Kotlin + Jetpack Compose will feel natural coming from Java."
        : "";
    return {
      title: local ? "Expo + on-device SQLite" : "Expo + Supabase",
      summary: local
        ? "A phone app that keeps data on the device, so there is no server at all."
        : "A phone app for both stores, with a hosted database and login behind it.",
      layers,
      start: { cmd: "npx create-expo-app@latest my-app", note },
      alt: "Flutter (Dart) if you prefer one toolkit that draws every pixel itself.",
      cost,
    };
  },

  api(s, lang) {
    const keys = L("Auth", "API keys per client, or JWT", "Simplest for service-to-service calls. Rotate per team.");
    const big = s.scale >= 3;
    const table = {
      py: {
        title: "FastAPI + Postgres",
        fw: L("Framework", "FastAPI", "Type hints become request validation and free interactive docs at /docs."),
        db: L("Database", "PostgreSQL + SQLAlchemy", "The standard Python ORM, async supported."),
        host: big ? L("Hosting", "Docker on Cloud Run", "Scales out automatically per request load.") : HOST.py,
        start: { cmd: 'pip install "fastapi[standard]"', note: "Then: fastapi dev main.py" },
        alt: big ? "Millions of calls a day work on FastAPI with enough instances. Go or ASP.NET Core need fewer servers." : "Expect very heavy traffic? Go or ASP.NET Core give more requests per server.",
      },
      ts: {
        title: "Hono + Drizzle + Postgres",
        fw: L("Framework", "Hono", "Tiny and fast. Runs on Node, Bun and Cloudflare Workers."),
        db: L("Database", "PostgreSQL + Drizzle ORM", "SQL-like, fully typed queries."),
        host: L("Hosting", "Cloudflare Workers or Fly.io", "Runs near your callers with almost no cold start."),
        start: { cmd: "npm create hono@latest my-api", note: "" },
        alt: "NestJS if a large team wants strict structure.",
      },
      net: {
        title: "ASP.NET Core Minimal API + Postgres",
        fw: L("Framework", "ASP.NET Core Minimal APIs", "Among the fastest mainstream web frameworks, OpenAPI built in."),
        db: DB.net,
        host: big ? L("Hosting", "Azure Container Apps", "Autoscaling containers, managed for you.") : HOST.net,
        start: { cmd: "dotnet new webapi -o MyApi", note: "Then: cd MyApi && dotnet watch" },
        alt: "FastAPI if the team prefers Python.",
      },
      java: {
        title: "Spring Boot + Postgres",
        fw: L("Framework", "Spring Boot", "Batteries-included REST with production defaults."),
        db: DB.java,
        host: HOST.java,
        start: { cmd: SPRING("web,data-jpa,postgresql,actuator"), note: "" },
        alt: "Quarkus for faster startup and lower memory in containers.",
      },
      go: {
        title: "Go net/http + pgx",
        fw: L("Framework", "Go standard library (net/http)", "No framework needed since Go 1.22 routing. One static binary."),
        db: DB.go,
        host: HOST.go,
        start: { cmd: "go mod init myapi && go get github.com/jackc/pgx/v5", note: "" },
        alt: "chi if you want middleware and route groups.",
      },
    };
    const t = table[lang] || table.py;
    const layers = [t.fw, t.db];
    if (s.flags.login) layers.push(keys);
    if (s.flags.realtime) layers.push(pick(REALTIME, lang === "any" ? "py" : lang));
    if (s.flags.payments) layers.push(PAY);
    if (s.flags.ai) layers.push(pick(AI, lang === "any" ? "py" : lang));
    if (big) layers.push(BIG_SCALE);
    layers.push(t.host);
    return {
      title: t.title,
      summary: big ? "A lean API built to scale out, with caching in front of the database." : "A clean, documented API with a real database behind it.",
      layers,
      start: t.start,
      alt: t.alt,
    };
  },

  ai(s, lang) {
    const knowledge = (name) => L("Your documents", name, "Only if it must answer from your own files: store chunks as embeddings and search them.");
    if (lang === "ts") {
      const layers = [
        L("App", "Next.js + Vercel AI SDK", "The useChat hook streams replies into a chat UI for you."),
        knowledge("pgvector on Supabase"),
      ];
      if (s.flags.login) layers.push(AUTH.ts);
      if (s.flags.payments) layers.push(PAY);
      layers.push(HOST.ts);
      return {
        title: "Next.js + Vercel AI SDK + pgvector",
        summary: "A streaming chat app in one TypeScript project.",
        layers,
        start: { cmd: "npx create-next-app@latest my-bot && cd my-bot && npm i ai", note: "Add your model provider package, e.g. @ai-sdk/anthropic or @ai-sdk/openai." },
        alt: "Heavy document work? Python's ecosystem (LlamaIndex, pandas) is richer.",
        cost: "Pay per AI request, usually cents",
      };
    }
    if (lang === "net") {
      const layers = [
        L("App", "Blazor + Microsoft.Extensions.AI", "Chat UI and model calls, all in C#."),
        knowledge("pgvector or Azure AI Search"),
      ];
      if (s.flags.login) layers.push(AUTH.net);
      layers.push(HOST.net);
      return {
        title: "Blazor + Microsoft.Extensions.AI",
        summary: "A .NET chat app with Microsoft's official AI building blocks.",
        layers,
        start: { cmd: "dotnet new install Microsoft.Extensions.AI.Templates && dotnet new aichatweb -o MyBot", note: "The template already wires chat, document ingestion and a vector store." },
        alt: "Quick prototype first? Streamlit in Python is the fastest demo.",
        cost: "Pay per AI request, usually cents",
      };
    }
    if (lang === "java" || lang === "go") {
      const layers = [
        L("App", lang === "java" ? "Spring Boot + Spring AI" : "Go + official model SDK", "Model calls in the language you know."),
        L("UI", "HTMX chat page", "A simple chat page without a front-end framework."),
        knowledge("pgvector on Postgres"),
      ];
      if (s.flags.login) layers.push(pick(AUTH, lang));
      layers.push(pick(HOST, lang));
      return {
        title: lang === "java" ? "Spring AI + pgvector" : "Go + model SDK + pgvector",
        summary: "A chat service in your own language, with document search on Postgres.",
        layers,
        start: lang === "java"
          ? { cmd: SPRING("web,postgresql"), note: "Then add the Spring AI starter for your model provider." }
          : { cmd: "go mod init mybot && go get github.com/anthropics/anthropic-sdk-go", note: "Or github.com/openai/openai-go." },
        alt: "Quick prototype first? Streamlit in Python is the fastest demo.",
        cost: "Pay per AI request, usually cents",
      };
    }
    const layers = [
      L("Chat UI", "Streamlit", "A working chat screen in about 30 lines with st.chat_input."),
      AI.py,
      knowledge("pgvector on Postgres"),
    ];
    if (s.flags.login) layers.push(L("Login", "Streamlit st.login (OIDC)", "Google or Microsoft sign-in, built in."));
    layers.push(L("Hosting", "Streamlit Community Cloud or Render", "Free for demos. Use a private server for company data."));
    return {
      title: "Streamlit + model SDK + pgvector",
      summary: "The fastest way to a working AI assistant, all in Python.",
      layers,
      start: { cmd: "pip install streamlit anthropic", note: "Swap anthropic for openai if you use OpenAI. Then: streamlit run app.py" },
      alt: "Going to real customers? Move the UI to Next.js + Vercel AI SDK and keep the AI logic in Python behind FastAPI.",
      cost: "Pay per AI request, usually cents",
    };
  },

  data(s, lang) {
    if (lang === "ts") {
      const layers = [
        L("App", "Next.js + shadcn/ui charts", "Good-looking charts (Recharts under the hood) in a normal web app."),
        L("Data", "SQL via Drizzle", "Typed queries against your existing database."),
      ];
      if (s.flags.login) layers.push(AUTH.ts);
      layers.push(HOST.ts);
      return {
        title: "Next.js + shadcn charts",
        summary: "A custom dashboard when off-the-shelf tools are not enough.",
        layers,
        start: { cmd: "npx create-next-app@latest my-dash", note: "Then: npx shadcn@latest add chart" },
        alt: "No code at all: Metabase connects to Postgres and builds dashboards by clicking.",
      };
    }
    if (lang === "net") {
      const layers = [
        L("App", "Blazor + MudBlazor", "Tables, filters and charts as C# components."),
        L("Data", "Dapper or EF Core", "Dapper for quick read-only reporting queries."),
      ];
      if (s.flags.login) layers.push(AUTH.net);
      layers.push(HOST.net);
      return {
        title: "Blazor + MudBlazor",
        summary: "An internal dashboard in C#.",
        layers,
        start: { cmd: "dotnet new install MudBlazor.Templates && dotnet new mudblazor -o MyDash", note: "" },
        alt: "If the company already pays for Power BI, a report there may be enough.",
      };
    }
    if (lang === "java" || lang === "go") {
      const tool = lang === "java"
        ? L("Tool", "Metabase (self-hosted)", "Point it at your database, build dashboards by clicking. Runs as a single Java jar.")
        : L("Tool", "Grafana", "Connects to Postgres, great for numbers that change over time.");
      return {
        title: lang === "java" ? "Metabase" : "Grafana + Postgres",
        summary: "Skip the code: a dashboard tool connected straight to your database.",
        layers: [tool, L("Access", "Its built-in users and SSO", "Share with the team without building login.")],
        start: lang === "java"
          ? { cmd: "docker run -d -p 3000:3000 metabase/metabase", note: "Open localhost:3000 and add your database." }
          : { cmd: "docker run -d -p 3000:3000 grafana/grafana", note: "Open localhost:3000 and add Postgres as a data source." },
        alt: "Need custom logic? Streamlit in Python is the quickest coded dashboard.",
      };
    }
    const layers = [
      L("App", "Streamlit", "Turns a Python script into an interactive dashboard."),
      L("Data", "pandas + SQLAlchemy", "Query the database and shape the numbers in Python."),
      L("Charts", "Plotly", "Interactive charts with hover and zoom."),
    ];
    if (s.flags.login) layers.push(L("Login", "Streamlit st.login (OIDC)", "Google or Microsoft sign-in, built in."));
    if (s.flags.ai) layers.push(AI.py);
    layers.push(L("Hosting", "A private server, or Streamlit Community Cloud for demos", "Keep company data off public hosting."));
    return {
      title: "Streamlit + pandas + Plotly",
      summary: "A Python dashboard on top of your existing database, in an afternoon.",
      layers,
      start: { cmd: 'pip install streamlit pandas plotly sqlalchemy "psycopg[binary]"', note: "Then: streamlit run app.py" },
      alt: "No code at all: Metabase connects to Postgres and builds dashboards by clicking.",
    };
  },

  desktop(s, lang) {
    const t = {
      net: {
        title: "Avalonia UI + SQLite",
        app: L("App", "Avalonia UI", "WPF-style XAML that also runs on Mac and Linux."),
        store: L("Storage", "SQLite + EF Core", "A single local file. Nothing to install."),
        pack: L("Installer", "Velopack", "Installer plus auto-updates."),
        start: { cmd: "dotnet new install Avalonia.Templates && dotnet new avalonia.mvvm -o MyApp", note: "" },
        alt: "Windows only? WPF or WinUI 3.",
      },
      py: {
        title: "PySide6 (Qt) + SQLite",
        app: L("App", "PySide6 (Qt for Python)", "Native-looking windows and widgets, the official Qt binding."),
        store: L("Storage", "SQLite (built into Python)", "A single local file. Nothing to install."),
        pack: L("Installer", "PyInstaller", "Bundles everything into one .exe."),
        start: { cmd: "pip install pyside6", note: "Then try: pyside6-designer to lay out windows visually." },
        alt: "Simple form-style tool? Flet builds Flutter-based UIs in Python.",
      },
      java: {
        title: "JavaFX + SQLite",
        app: L("App", "JavaFX", "Modern Java desktop UI."),
        store: L("Storage", "SQLite (sqlite-jdbc)", "A single local file."),
        pack: L("Installer", "jpackage", "Native installers, built into the JDK."),
        start: { cmd: "mvn archetype:generate -DarchetypeGroupId=org.openjfx -DarchetypeArtifactId=javafx-archetype-simple", note: "" },
        alt: "Compose Multiplatform if you are open to Kotlin.",
      },
      go: {
        title: "Wails + SQLite",
        app: L("App", "Wails", "Go back end with a web UI, like Tauri for Go."),
        store: L("Storage", "SQLite (modernc.org/sqlite)", "Pure Go, no C compiler needed."),
        pack: L("Installer", "wails build", "Produces a native executable."),
        start: { cmd: "go install github.com/wailsapp/wails/v2/cmd/wails@latest && wails init -n myapp", note: "" },
        alt: "Fyne for a pure-Go UI with no web view.",
      },
      ts: {
        title: "Tauri + React",
        app: L("App", "Tauri + React", "Web UI in a tiny installer (a few MB) using the system web view."),
        store: L("Storage", "SQLite (tauri-plugin-sql)", "A single local file."),
        pack: L("Installer", "Tauri bundler", ".msi on Windows, .dmg on Mac."),
        start: { cmd: "npm create tauri-app@latest", note: "Needs Rust and the Microsoft C++ Build Tools installed once." },
        alt: "Electron if you want zero Rust setup. Installers are bigger (about 100 MB).",
      },
    };
    const d = t[lang] || t.ts;
    const layers = [d.app, d.store];
    if (s.flags.ai) layers.push(pick(AI, lang === "any" ? "ts" : lang));
    layers.push(d.pack);
    return { title: d.title, summary: "An installable app that keeps its data in a local file.", layers, start: d.start, alt: d.alt, cost: "Free" };
  },

  script(s, lang) {
    const schedule = L("Schedule", "Windows Task Scheduler / cron, or GitHub Actions", "Runs it every morning without a server of your own.");
    const t = {
      ts: {
        title: "Node + TypeScript + commander",
        layers: [
          L("Runtime", "Node.js + tsx", "Run TypeScript files directly, no build step."),
          L("CLI", "commander", "Arguments and help text for free."),
          L("Secrets", ".env + dotenv", "Keep API keys out of the code."),
        ],
        start: { cmd: "npm init -y && npm i commander dotenv && npm i -D tsx typescript", note: "Then: npx tsx index.ts" },
      },
      net: {
        title: ".NET console app",
        layers: [
          L("Runtime", ".NET console app", "Typed, fast, and easy to call your company's .NET libraries."),
          L("CLI", "Spectre.Console.Cli", "Commands, arguments and nice terminal output."),
          L("Secrets", "User secrets / environment variables", "Keep API keys out of the code."),
        ],
        start: { cmd: "dotnet new console -o MyTool", note: "Cloud option: an Azure Functions timer trigger runs it on a schedule." },
      },
      java: {
        title: "Java + JBang",
        layers: [
          L("Runtime", "JBang", "Run a single .java file like a script, dependencies declared at the top."),
          L("CLI", "picocli", "The standard Java CLI library."),
          L("Secrets", "Environment variables", "Keep API keys out of the code."),
        ],
        start: { cmd: "jbang init --template=cli mytool.java", note: "" },
      },
      go: {
        title: "Go + Cobra",
        layers: [
          L("Runtime", "Go", "Compiles to one binary you can copy anywhere."),
          L("CLI", "Cobra", "Commands and flags, used by kubectl and gh."),
          L("Secrets", "Environment variables", "Keep API keys out of the code."),
        ],
        start: { cmd: "go mod init mytool && go install github.com/spf13/cobra-cli@latest", note: "" },
      },
      py: {
        title: "Python + httpx + Typer",
        layers: [
          L("Language", "Python", "The shortest path from idea to a working script."),
          L("HTTP", "httpx", "Calls REST APIs like Freshdesk, Slack or Jira."),
          L("CLI", "Typer", "Turns your functions into a clean command-line tool."),
          L("Secrets", ".env + python-dotenv", "Keep API keys out of the code."),
        ],
        start: { cmd: "pip install httpx typer python-dotenv", note: "Then: python main.py" },
      },
    };
    const d = t[lang] || t.py;
    const layers = [...d.layers];
    if (s.flags.ai) layers.push(pick(AI, lang === "any" ? "py" : lang));
    layers.push(schedule);
    return {
      title: d.title,
      summary: "A small script that runs on a schedule. No server, no UI.",
      layers,
      start: d.start,
      alt: "Want no code at all? Power Automate or Zapier handle simple pull-and-notify flows.",
      cost: "Free",
    };
  },

  game(s, lang, idea) {
    const inBrowser = /\b(browser|web|online)\b/i.test(idea || "");
    if (lang === "ts" || (lang === "any" && inBrowser)) {
      const layers = [
        L("Engine", "Phaser + Vite", "The most used 2D web game framework. Runs in any browser."),
      ];
      if (s.flags.realtime) layers.push(L("Multiplayer", "Colyseus", "Room-based game server for Node that keeps everyone in sync."));
      layers.push(L("Art", "Kenney asset packs", "Thousands of free (CC0) sprites and sounds."));
      layers.push(L("Hosting", s.flags.realtime ? "itch.io or Netlify + Fly.io for the game server" : "itch.io or Netlify", "Free hosting for browser games."));
      return {
        title: s.flags.realtime ? "Phaser + Colyseus" : "Phaser",
        summary: "A browser game players open with a link, nothing to install.",
        layers,
        start: { cmd: "npm create @phaserjs/game@latest", note: s.flags.realtime ? "Server: npm create colyseus-app@latest" : "" },
        alt: "Godot if it grows beyond a 2D web game.",
        cost: "Free",
      };
    }
    const engines = {
      net: ["Unity", "C# everywhere and the largest tutorial library.", "Netcode for GameObjects", "Install Unity Hub from unity.com, then create a 2D or 3D project.", "Godot with C# for a lighter, open-source engine."],
      java: ["libGDX", "Mature Java game framework for desktop, Android and web.", "KryoNet", "Use the gdx-liftoff project generator from libgdx.com.", "Godot if you want a visual editor."],
      go: ["Ebitengine", "Simple 2D engine in pure Go, exports to the browser.", "WebSockets (coder/websocket)", "go mod init mygame && go get github.com/hajimehoshi/ebiten/v2", "Godot if you want a visual editor."],
    };
    if (engines[lang]) {
      const [name, why, mp, cmd, alt] = engines[lang];
      const layers = [L("Engine", name, why)];
      if (s.flags.realtime) layers.push(L("Multiplayer", mp, "Keeps players in sync."));
      layers.push(L("Art", "Kenney asset packs", "Thousands of free (CC0) sprites and sounds."));
      layers.push(L("Publish", "itch.io or Steam", "itch.io is free; Steam has a one-time fee per game."));
      return { title: name, summary: "A game engine in the language you already know.", layers, start: { cmd, note: "" }, alt, cost: "Free" };
    }
    const layers = [
      L("Engine", "Godot 4", "Free and open source. GDScript reads like Python. Exports to web, desktop and mobile."),
    ];
    if (s.flags.realtime) layers.push(L("Multiplayer", "Godot high-level multiplayer", "WebSocket or WebRTC peers, built into the engine."));
    layers.push(L("Art", "Kenney asset packs", "Thousands of free (CC0) sprites and sounds."));
    layers.push(L("Publish", "itch.io", "Free hosting for web and desktop builds."));
    return {
      title: "Godot 4",
      summary: "A full game engine that is free, light and friendly to beginners.",
      layers,
      start: { cmd: "Download Godot 4 from godotengine.org", note: "No installer on Windows. It is one .exe." },
      alt: lang === "py" ? "Learning to code? Pygame CE is great for small 2D games: pip install pygame-ce" : "Unity if you aim for big 3D or console games.",
      cost: "Free",
    };
  },

  store(s, lang) {
    const t = {
      ts: {
        title: "Medusa + Next.js storefront",
        layers: [
          L("Commerce engine", "Medusa", "Open-source store back end in Node: products, carts, orders."),
          L("Storefront", "Next.js starter", "Fast product pages, ready to restyle."),
          L("Payments", "Stripe", "Cards, wallets and local methods."),
          L("Hosting", "Railway for Medusa, Vercel for the storefront", "Each part deploys from Git."),
        ],
        start: { cmd: "npx create-medusa-app@latest", note: "It can create the Next.js storefront for you." },
        cost: "Free software, pay for hosting",
      },
      py: {
        title: "Saleor (Django + GraphQL)",
        layers: [
          L("Commerce engine", "Saleor", "Open-source store back end built on Django."),
          L("Storefront", "Next.js storefront", "Saleor ships a ready storefront."),
          L("Payments", "Stripe", "Cards, wallets and local methods."),
          L("Hosting", "Docker on any cloud, or Saleor Cloud", "Self-host or let them run it."),
        ],
        start: { cmd: "git clone https://github.com/saleor/saleor-platform && cd saleor-platform && docker compose up", note: "" },
        cost: "Free software, pay for hosting",
      },
      net: {
        title: "nopCommerce",
        layers: [
          L("Commerce engine", "nopCommerce", "Mature open-source store on ASP.NET Core."),
          L("Payments", "Stripe or PayPal plugin", "Install from the marketplace."),
          L("Hosting", "Azure App Service", "Runs well on standard .NET hosting."),
        ],
        start: { cmd: "Download from nopcommerce.com", note: "" },
        cost: "Free software, pay for hosting",
      },
    }[lang];
    const shopify = {
      title: "Shopify",
      layers: [
        L("Store", "Shopify", "Hosted store, checkout, taxes and payments done for you. You focus on products."),
        L("Theme", "Dawn (free theme)", "Clean, fast, mobile-friendly."),
        L("Payments", "Shopify Payments", "Cards, Apple Pay and Google Pay with no setup."),
        L("Domain", "Your own domain", "Buy or connect it inside Shopify."),
      ],
      start: { cmd: "Start a free trial at shopify.com", note: "Pick the Dawn theme and add your first product." },
      cost: "Monthly plan after the trial",
    };
    const d = t || shopify;
    const layers = [...d.layers];
    if (s.flags.ai) layers.push(L("AI", "Product description and support helpers", "Generate copy and answer FAQs. Keep a human review step."));
    return {
      title: d.title,
      summary: t ? "An open-source store you own end to end." : "Don't build checkout yourself. A hosted store gets you selling this week.",
      layers,
      start: d.start,
      alt: t ? "Want zero maintenance? Shopify does all of this for a monthly fee." : "Selling only a few items? Stripe Payment Links on an Astro site costs nothing per month.",
      cost: d.cost,
    };
  },

  extension(s, lang) {
    const layers = [
      L("Framework", "WXT", "One codebase for Chrome, Edge and Firefox (Manifest V3), with hot reload."),
      L("UI", "React or plain TypeScript", "React for popups with state, plain TS for page tweaks."),
      L("Storage", "WXT storage (chrome.storage)", "Saves settings and syncs them across the user's browsers."),
    ];
    if (s.flags.ai) layers.push(L("AI", "Your own API + model SDK", "Never ship API keys in an extension. Anyone can read its code."));
    if (s.flags.login) layers.push(L("Login", "Your web app's login (OAuth)", "Use chrome.identity to sign in through your site."));
    layers.push(L("Publish", "Chrome Web Store", "$5 one-time developer fee. Firefox Add-ons is free."));
    return {
      title: "WXT + TypeScript",
      summary: lang === "ts" || lang === "any"
        ? "A modern extension setup that targets every major browser."
        : "Extensions only run JavaScript, so this is TypeScript whatever you know. WXT keeps it simple.",
      layers,
      start: { cmd: "npx wxt@latest init my-extension", note: "Then: npm run dev opens a browser with it loaded." },
      alt: "Plasmo, a similar framework with a React-first setup.",
      cost: "$5 one-time Chrome Web Store fee",
    };
  },
};

const BASE_EFFORT = {
  website: 1, script: 1, extension: 1, data: 1, store: 1,
  ai: 2, api: 2, webapp: 2, mobile: 2, desktop: 2, game: 2,
};

const DEFAULT_COST = {
  website: "Free to host",
  webapp: "Free tiers to start",
  api: "Free tiers to start",
  data: "Free",
};

function buildStack(s, idea) {
  const lang = s.lang === "any" ? DEFAULT_LANG[s.kind] : s.lang;
  const out = BUILDERS[s.kind](s, lang, idea);
  let effort = BASE_EFFORT[s.kind] + (s.flags.realtime ? 1 : 0) + (s.scale >= 3 ? 1 : 0);
  if (s.kind === "store" && out.title !== "Shopify") effort += 1;
  out.difficulty = effort <= 1 ? "Easy" : effort === 2 ? "Medium" : "Hard";
  out.cost = out.cost || DEFAULT_COST[s.kind] || "Free tiers to start";
  out.lang = lang;
  return out;
}
