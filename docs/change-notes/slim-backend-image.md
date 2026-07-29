# chore(docker): slim backend image with multi-stage build

Split the backend Dockerfile into build and runtime stages to drop dev dependencies from the shipped image.
