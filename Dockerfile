FROM node:20-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port (update as necessary)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]