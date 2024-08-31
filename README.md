# JS File API - PNG Size Detection Benchmark
This is a small benchmark to test a few approached to reading out the size of PNG files using the standard JS File API.

## Try it yourself
You can open and run the benchmark yourself by simply opening [this Link](https://spacefendy.github.io/browser-png-size-detection-benchmark/).

## Setup
To set up the project, check it out, install the dependencies using PNPM:
```bash
pnpm i
```

Since the FileSystemAccessApi requires the page to be accessed through HTTPS, please locally set up a valid SSL certificate + key and set them for this project as env-variables.

```
SSL_KEY=<PATH TO YOUR SSL.key>
SSL_CERT=<PATH TO YOUR SSL.crt/.pem>
```

Then simply run the project using:

```bash
pnpm run dev
```

## Build

To build it use the build script:

```bash
pnpm run build
```

## Results

I ran each test 4 times using a directory with a bunch of dumped textures from PPSSPP.

Note: Since all of them start with a "standard" chunk layout (IHDR first) and are relatively small each, the results are
obviously biased, so keep that in mind and check against your own use-case.

### Folder on SSD

| Test                                               | File Count | Duration    | Avg Duration | Hit Rate |
|----------------------------------------------------|------------|-------------|--------------|----------|
| detectSizeExpectIHDRFirst                          | 158136     | 59460.50ms  | 0.38ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirst                   | 158136     | 46760.80ms  | 0.30ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirstSkipSignatureCheck | 158136     | 46892.00ms  | 0.30ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirstCheckTypeViaFile   | 158136     | 49497.20ms  | 0.31ms       | 100.00%  |
| detectSizeChunkForChunk                            | 158136     | 102043.30ms | 0.65ms       | 100.00%  |
| detectSizeReadAll                                  | 158136     | 46577.60ms  | 0.29ms       | 100.00%  |
| detectSizeLoadAsImage                              | 158136     | 107370.50ms | 0.68ms       | 100.00%  |

### Folder on HDD

| Test                                               | File Count | Duration    | Avg Duration | Hit Rate |
|----------------------------------------------------|------------|-------------|--------------|----------|
| detectSizeExpectIHDRFirst                          | 158136     | 58009.20ms  | 0.37ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirst                   | 158136     | 60267.00ms  | 0.38ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirstSkipSignatureCheck | 158136     | 57777.40ms  | 0.37ms       | 100.00%  |
| detectSizeReadAllExpectIHDRFirstCheckTypeViaFile   | 158136     | 57556.70ms  | 0.36ms       | 100.00%  |
| detectSizeChunkForChunk                            | 158136     | 133532.10ms | 0.84ms       | 100.00%  |
| detectSizeReadAll                                  | 158136     | 57897.00ms  | 0.37ms       | 100.00%  |
| detectSizeLoadAsImage                              | 158136     | 105559.50ms | 0.67ms       | 100.00%  |
