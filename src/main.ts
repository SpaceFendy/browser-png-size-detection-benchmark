const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

// General utils
let dir: FileSystemDirectoryHandle;
const selectDirectory = async () => {
    dir = await window.showDirectoryPicker({
        mode: 'readwrite',
    });
    dirInput.value = dir.name;
};

// HTML stuff
const dirInput = $<HTMLInputElement>('#directory-input');
const selectDirButton = $('#select-directory-button');
selectDirButton.addEventListener('click', selectDirectory);

const printOutput = (str: string) => $('#output').innerHTML = str;

$('#detect-sizes').addEventListener('click', async () => {
    if (!dir) {
        printOutput('No directory selected!');
        return;
    }

    const runCount = parseInt($<HTMLInputElement>('#amount-of-runs-input').value);
    if (!runCount || runCount < 1) {
        printOutput('Invalid "Amount of times tests should" value!')
        return;
    }

    printOutput('Starting...');

    // Test fns
    type TestFn = (file: File) => Promise<[number, number] | undefined>;
    const testFns: TestFn[] = [
        detectSizeExpectIHDRFirst,
        detectSizeReadAllExpectIHDRFirst,
        detectSizeReadAllExpectIHDRFirstSkipSignatureCheck,
        detectSizeReadAllExpectIHDRFirstCheckTypeViaFile,
        detectSizeChunkForChunk,
        detectSizeReadAll,
        detectSizeLoadAsImage,
    ];

    // Run tests and collect output
    let output = '';
    for (let i=4; i<testFns.length; i++) {
        const testFn = testFns[i];
        printOutput(`Running Test ${i + 1}/${testFns.length} [${testFn.name}]`);
        if (i === 5) {
            break;
        }

        const start = performance.now();

        let fileCount = 0;
        let hitCount = 0;

        // Iterate through all files
        for (let r=0; r<runCount; r++) {
            for await (const entry of dir.values()) {
                if (entry instanceof FileSystemFileHandle) {
                    const file = await entry.getFile();
                    fileCount++;

                    const res = await testFn(file);
                    if (res && res[0] && res[1]) {
                        hitCount++;
                    }
                }
            }
        }

        const duration = performance.now() - start;

        output += `<tr>
            <td>${testFn.name}</td>
            <td>${fileCount}</td>
            <td>${duration.toFixed(2)}ms</td>
            <td>${(duration/fileCount).toFixed(2)}ms</td>
            <td>${(hitCount/fileCount * 100).toFixed(2)}%</td>
        </tr>`;
    }

    // Output results
    printOutput(`<table border="1"><tr>
        <th>Test</th>
        <th>File Count</th>
        <th>Duration</th>
        <th>Avg Duration</th>
        <th>Hit Rate</th>
    </tr>${output}</table>`);
});

// Byte reading utils
const readByteSlice = async (file: File, start: number, end: number) =>
    new Uint8Array(
        await file.slice(start, end).arrayBuffer());

const numberFromBytes = (bytes: Uint8Array, offset: number) =>
    (bytes[offset] << 24) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset+ 3];

const checkPngSignature = (bytes: Uint8Array) =>
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A;

// Methods
const detectSizeExpectIHDRFirst = async (file: File): Promise<[number, number] | undefined> => {
    const bytes = await readByteSlice(file, 0, 24);

    if (!checkPngSignature(bytes)) {
        return;
    }

    const width = numberFromBytes(bytes, 16);
    const height = numberFromBytes(bytes, 20);
    return [width, height];
};

const detectSizeChunkForChunk = async (file: File): Promise<[number, number] | undefined> => {
    // Signature (8 bytes) + First Chunk (4 bytes length + 4 bytes type)
    let bytes = await readByteSlice(file, 0, 16);

    if (!checkPngSignature(bytes)) {
        return;
    }

    let offset = bytes.length;
    while (offset < file.size) {
        // Check type
        const isIHDR =
            bytes[bytes.length - 4] === 0x49 &&
            bytes[bytes.length - 3] === 0x48 &&
            bytes[bytes.length - 2] === 0x44 &&
            bytes[bytes.length - 1] === 0x52;

        // Chunk size
        const chunkSize = numberFromBytes(bytes, bytes.length - 8);

        // Read size
        if (isIHDR) {
            const chunkData = await readByteSlice(file, offset, offset + chunkSize);
            const width = numberFromBytes(chunkData, 0);
            const height = numberFromBytes(chunkData, 4);
            return [width, height];
        }

        // Load next chunk (+4 for crc after chunk data btw)
        bytes = await readByteSlice(file,
            offset + 4 + chunkSize,
            offset + chunkSize + 4 + 8);
        offset += bytes.length;
    }

    console.error('Could not find IHDR chunk!');
    return undefined;
};

const detectSizeReadAll = async (file: File): Promise<[number, number] | undefined> => {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (!checkPngSignature(bytes)) {
        return;
    }

    let offset = 16;
    while (offset < file.size) {
        // Check type
        const isIHDR =
            bytes[offset - 4] === 0x49 &&
            bytes[offset - 3] === 0x48 &&
            bytes[offset - 2] === 0x44 &&
            bytes[offset - 1] === 0x52;

        // Read size
        if (isIHDR) {
            const width = numberFromBytes(bytes, offset);
            const height = numberFromBytes(bytes, offset + 4);

            return [width, height];
        }

        // Update offset for this chunk
        const chunkSize = numberFromBytes(bytes, offset - 8);

        // Load next chunk (+4 for crc after chunk data btw, +8 for next chunk size and header)
        offset += chunkSize + 4 + 8;
    }

    console.error('Could not find IHDR chunk!');
    return undefined;
};

const detectSizeReadAllExpectIHDRFirst = async (file: File): Promise<[number, number] | undefined> => {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (!checkPngSignature(bytes)) {
        return;
    }

    const width = numberFromBytes(bytes, 16);
    const height = numberFromBytes(bytes, 20);
    return [width, height];
};

const detectSizeReadAllExpectIHDRFirstSkipSignatureCheck = async (file: File): Promise<[number, number] | undefined> => {
    const bytes = new Uint8Array(await file.arrayBuffer());

    const width = numberFromBytes(bytes, 16);
    const height = numberFromBytes(bytes, 20);
    return [width, height];
};

const detectSizeReadAllExpectIHDRFirstCheckTypeViaFile = async (file: File): Promise<[number, number] | undefined> => {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (file.type !== 'image/png') {
        return;
    }

    const width = numberFromBytes(bytes, 16);
    const height = numberFromBytes(bytes, 20);
    return [width, height];
};

const detectSizeLoadAsImage = async (file: File): Promise<[number, number] | undefined> => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res([img.width, img.height]);
    img.onerror = () => rej('Error loading image!');
    img.src = URL.createObjectURL(file);
    img.onloadedmetadata
});
