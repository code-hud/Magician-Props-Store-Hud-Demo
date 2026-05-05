FROM node:18-alpine

WORKDIR /app

# Build-time arg for the git commit hash. docker-compose passes this in.
# Fail the build if it's empty so we never produce an image tagged "unknown".
ARG GIT_COMMIT_SHA
RUN if [ -z "$GIT_COMMIT_SHA" ]; then \
      echo "ERROR: GIT_COMMIT_SHA build-arg is required (got empty value)"; \
      exit 1; \
    fi
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}

COPY package*.json ./

RUN npm install --legacy-peer-deps --prefer-offline --no-audit || npm install --legacy-peer-deps --no-audit

COPY . .

RUN npm run build || true

EXPOSE 3001

CMD ["npm", "run", "start"]
