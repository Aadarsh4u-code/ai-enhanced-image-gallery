# Homework Assignment: AI-Enhanced Image Gallery

## Objective

This assignment is designed to assess your full-stack development skills (React, Node.js) and your expertise in AI engineering. Your goal is to complete a frontend application and build a functional, AI-powered backend service for it.

### Part 1: Image Gallery

#### Task

Using provided template, build the user interface for an image gallery.

#### Requirements

1. Images should be presented in a responsive, infinite-scroll container. Each image should display the author's name next to it.
2. The image data displayed in the final application must be served from your own Node.js backend service. For initial, rapid UI development, you may fetch directly from the public [Picsum Photos API](https://picsum.photos/), but the final submission must use your backend as the single source of truth for the frontend.
3. The UI must include an interface that allows a user to interact with the AI-powered backend you will build in Part 2. You have the creative freedom to decide if this is a chat widget, a smart search bar, or another interface of your choosing.

### Part 2: The AI Backend

#### Task

Build a Node.js backend service that adds one or more AI-powered features to the image gallery.

#### The Challenge

- Your goal is to demonstrate your expertise in architecting and building systems for AI.
- You have the freedom to decide what feature to build and how to implement it. This could involve, but is not limited to, semantic search, automated tagging, an interactive agent/copilot, or another feature of your own design.
- **Constraint:** You will not have access to a paid LLM provider's API key. You must design your system to be fully functional without it, either by using open-source models, mocking the AI component in an intelligent way, or by focusing on the data engineering and systems architecture that supports AI.

### Deliverables

Your submission is this completed repository. Before you finish, please ensure the following

1. All your code for both the frontend and backend is pushed to this repository.
2. The `README.md` file is updated with the following critical information:
    - A clear explanation of the AI feature(s) you chose to build.
    - An overview of your architectural decisions and why you made them.
    - **Clear, step-by-step instructions** on how to install all dependencies and run the entire application (frontend and backend) concurrently.


### Evaluation Criteria

We will evaluate your submission on the quality of the frontend implementation, the creativity and technical soundness of the AI backend architecture, the clarity of your documentation, and the overall functionality when both parts are run together.