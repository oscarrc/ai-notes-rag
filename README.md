# AI Notes: A RAG-Driven AI-Powered Personal Knowledge Base

## Overview

**AI Notes** is a self-hostable, markdown-based note-taking web application designed to provide users with a privacy-focused, AI-powered knowledge management system. The application integrates **Retrieval-Augmented Generation (RAG)** and **semantic search** capabilities, allowing users to interact with their notes using an AI chatbot that generates responses based on stored content. The system is optimized for in-browser execution using **Small Language Models (SLMs)** and lightweight vector databases, ensuring efficient and secure knowledge retrieval without relying on cloud-based services.

## Key Features

- **Markdown-Based Note-Taking**: Create, edit, and organize notes using markdown syntax.
- **Semantic Search**: Efficiently search through notes using vector-based semantic search.
- **AI-Powered Querying**: Interact with your notes using an AI chatbot powered by Retrieval-Augmented Generation (RAG).
- **In-Browser Execution**: AI models run directly in the browser using **ONNX Runtime**, ensuring privacy and reducing reliance on external servers.
- **Self-Hostable**: Deploy the application on your own infrastructure using **Docker**.
- **Lightweight Vector Database**: Utilizes **LanceDB** for efficient storage and retrieval of embeddings.
- **Cross-Platform Accessibility**: Built as a **Progressive Web App (PWA)**, ensuring a responsive and lightweight user experience across devices.

## Technologies Used

- **Frontend**: Next.js
- **Backend**: Next.js API routes
- **AI Models**: Small Language Models (SLMs) optimized via distillation and quantization
- **Vector Database**: LanceDB
- **In-Browser Inference**: ONNX Runtime / Transformers.js
- **Containerization**: Docker
- **Version Control**: Git (GitHub)

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Docker (optional, for self-hosting)
- Git

### Steps

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-username/ai-notes.git
   cd ai-notes
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Run the Application Locally**:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

4. **Self-Hosting with Docker**:
   - Build the Docker image:
     ```bash
     docker build -t ai-notes .
     ```
   - Run the Docker container:
     ```bash
     docker run -p 3000:3000 ai-notes
     ```
     The application will be available at `http://localhost:3000`.

## Usage

1. **Create Notes**: Use the markdown editor to create and edit notes.
2. **Semantic Search**: Use the search bar to find relevant notes based on semantic similarity.
3. **AI Chatbot**: Interact with the AI chatbot to query your notes. The chatbot will generate responses based on the content of your notes using RAG.

## Project Structure

```
ai-notes/
├── public/              # Static assets
├── app/                 # Source code
│   ├── _components/     # Shared React components
│   ├── _hooks/          # Custom React hooks
│   ├── _providers/      # Context providers (e.g., AI, Toast, Query)
│   ├── _store/          # Zustand stores for state management
│   ├── _utils/          # Utility functions
│   ├── _workers/        # Web workers for AI tasks
│   ├── api/             # API routes for backend logic
│   ├── chat/            # Chat-related components and pages
│   ├── graph/           # Graph visualization components
│   ├── vault/           # Note management components
│   └── layout.tsx       # Application layout
├── Dockerfile           # Docker configuration
├── next.config.js       # Next.js configuration
├── package.json         # Node.js dependencies and scripts
└── README.md            # Project documentation
```

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push to your branch.
4. Submit a pull request with a detailed description of your changes.

## Contact

For any questions or feedback, please contact:

- **Oscar Rey Castro**  
  Email: or24aab@herts.ac.uk  
  GitHub: [oscarrc](https://github.com/oscarr)

---

**AI Notes** is a project developed as part of the BSc Computer Science program at the University of Hertfordshire.  
Supervisor: **Dr. Iain Werry**  
Academic Year: 2024/25
