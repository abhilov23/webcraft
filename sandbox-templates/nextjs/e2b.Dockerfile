FROM node:21-slim

RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy to /usr/local/bin so it's on PATH
COPY compile_page.sh /usr/local/bin/compile_page.sh
RUN chmod +x /usr/local/bin/compile_page.sh

WORKDIR /home/user/nextjs-app

RUN npx --yes create-next-app@15.3.3 . --yes 

RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes

RUN npm install tw-animate-css

RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app