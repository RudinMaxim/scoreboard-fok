FROM alpine:3.22 AS toolchain

RUN apk add --no-cache g++ make

WORKDIR /src/apps/timer-service

COPY apps/timer-service/cpp ./cpp

FROM toolchain AS build

RUN test -d cpp/include && test -d cpp/src && test -d cpp/tests

FROM alpine:3.22 AS runtime

WORKDIR /app

ENV TIMER_SERVICE_PORT=3010
ENV GAME_CLOCK_DURATION_MS=600000
ENV SHOT_CLOCK_DURATION_MS=24000

EXPOSE 3010

CMD ["sh", "-c", "echo 'timer-service C++ implementation is pending'; sleep infinity"]
