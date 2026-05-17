FROM alpine:3.22 AS toolchain

RUN apk add --no-cache g++ make

WORKDIR /src/apps/mcu-firmware

COPY apps/mcu-firmware/firmware ./firmware

RUN test -d firmware/include && test -d firmware/src && test -d firmware/tests

CMD ["sh", "-c", "echo 'mcu-firmware C++ implementation is pending'"]
