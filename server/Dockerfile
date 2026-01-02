# Use an official Node runtime as a parent image
FROM node:18-slim

# Install system dependencies (Python, FFmpeg, curl)
# yt-dlp requires Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Download yt-dlp for Linux (replacing the macOS one used in dev)
# We rename it to yt-dlp to match what the code expects, or ensuring it's executable
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

# Copy the rest of the server code
COPY . .

# Expose the port
EXPOSE 4000

# Define env vars to tell code to use system binaries if needed
# We will modify index.js to look for 'yt-dlp' in PATH if local file missing or via ENV
ENV USE_SYSTEM_BINARIES=true

# Start the server
CMD ["node", "index.js"]
