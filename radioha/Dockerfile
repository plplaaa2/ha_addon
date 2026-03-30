FROM node:alpine

# 필요한 패키지 설치 (ffmpeg)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 애플리케이션 파일 복사
COPY index.js .
COPY index.html .
COPY package.json .
COPY radio-list.json .
COPY run.sh .

# 실행 권한 부여 및 의존성 설치
RUN chmod a+x run.sh
RUN npm install

ENTRYPOINT [ "./run.sh" ]
