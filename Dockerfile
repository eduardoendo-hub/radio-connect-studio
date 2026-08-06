FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --include=dev
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TENANT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_TENANT=$NEXT_PUBLIC_TENANT
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
ENV PORT=3001
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3001
CMD ["node", "server.js"]
