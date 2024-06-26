# Use a Node.js base image
FROM node:alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json) to the working directory
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy the rest of the source code to the working directory
COPY . .

# Build the Next.js application
RUN yarn build

# Expose port 3005
EXPOSE 3005

# Start the Next.js application when the container starts
CMD ["yarn", "start"]
